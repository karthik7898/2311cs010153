require('dotenv').config({ quiet: true });

const axios = require('axios');

const DEFAULT_NOTIFICATIONS_ENDPOINT = '/evaluation-service/notifications';
const DEFAULT_TOP_LIMIT = 10;

const PRIORITY_RANK = Object.freeze({
  placement: 3,
  result: 2,
  event: 1,
});

function buildUrl(baseUrl, endpoint) {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  return `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
}

function getApiConfiguration() {
  const { BASE_URL, ACCESS_TOKEN } = process.env;
  const endpoint =
    process.env.NOTIFICATIONS_API ||
    process.env.NOTIFICATIONS_ENDPOINT ||
    DEFAULT_NOTIFICATIONS_ENDPOINT;

  if (!BASE_URL || !ACCESS_TOKEN) {
    throw new Error('Notification API configuration is missing');
  }

  return {
    url: buildUrl(BASE_URL, endpoint),
    config: {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        Accept: 'application/json',
      },
    },
  };
}

function extractNotifications(responseBody) {
  if (Array.isArray(responseBody)) {
    return responseBody;
  }

  if (responseBody && Array.isArray(responseBody.notifications)) {
    return responseBody.notifications;
  }

  if (responseBody && Array.isArray(responseBody.data)) {
    return responseBody.data;
  }

  throw new Error('Invalid notifications API response');
}

function normalizeNotificationType(notification) {
  return String(
    notification.Type ??
      notification.type ??
      notification.Category ??
      notification.category ??
      '',
  )
    .trim()
    .toLowerCase();
}

function getCreatedAtMillis(notification) {
  const createdAt =
    notification.CreatedAt ??
    notification.createdAt ??
    notification.Timestamp ??
    notification.timestamp ??
    notification.Date ??
    notification.date;

  const timestamp = new Date(createdAt).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function createInboxEntry(notification, sequence) {
  const priorityType = normalizeNotificationType(notification);

  return {
    notification,
    sequence,
    priorityType,
    priorityRank: PRIORITY_RANK[priorityType] || 0,
    createdAtMillis: getCreatedAtMillis(notification),
  };
}

function isBetterNotification(left, right) {
  if (left.priorityRank !== right.priorityRank) {
    return left.priorityRank > right.priorityRank;
  }

  if (left.createdAtMillis !== right.createdAtMillis) {
    return left.createdAtMillis > right.createdAtMillis;
  }

  return left.sequence > right.sequence;
}

function isWorseNotification(left, right) {
  if (left.priorityRank !== right.priorityRank) {
    return left.priorityRank < right.priorityRank;
  }

  if (left.createdAtMillis !== right.createdAtMillis) {
    return left.createdAtMillis < right.createdAtMillis;
  }

  return left.sequence < right.sequence;
}

class BoundedPriorityQueue {
  constructor(limit) {
    if (!Number.isSafeInteger(limit) || limit <= 0) {
      throw new TypeError('Priority queue limit must be a positive integer');
    }

    this.limit = limit;
    this.items = [];
  }

  size() {
    return this.items.length;
  }

  peekWorst() {
    return this.items[0];
  }

  push(entry) {
    if (this.size() < this.limit) {
      this.items.push(entry);
      this.bubbleUp(this.items.length - 1);
      return;
    }

    if (isBetterNotification(entry, this.peekWorst())) {
      this.items[0] = entry;
      this.bubbleDown(0);
    }
  }

  toArray() {
    return [...this.items];
  }

  bubbleUp(index) {
    let currentIndex = index;

    while (currentIndex > 0) {
      const parentIndex = Math.floor((currentIndex - 1) / 2);

      if (
        !isWorseNotification(
          this.items[currentIndex],
          this.items[parentIndex],
        )
      ) {
        break;
      }

      this.swap(currentIndex, parentIndex);
      currentIndex = parentIndex;
    }
  }

  bubbleDown(index) {
    let currentIndex = index;

    while (true) {
      const leftChildIndex = currentIndex * 2 + 1;
      const rightChildIndex = currentIndex * 2 + 2;
      let worstIndex = currentIndex;

      if (
        leftChildIndex < this.items.length &&
        isWorseNotification(this.items[leftChildIndex], this.items[worstIndex])
      ) {
        worstIndex = leftChildIndex;
      }

      if (
        rightChildIndex < this.items.length &&
        isWorseNotification(this.items[rightChildIndex], this.items[worstIndex])
      ) {
        worstIndex = rightChildIndex;
      }

      if (worstIndex === currentIndex) {
        break;
      }

      this.swap(currentIndex, worstIndex);
      currentIndex = worstIndex;
    }
  }

  swap(leftIndex, rightIndex) {
    [this.items[leftIndex], this.items[rightIndex]] = [
      this.items[rightIndex],
      this.items[leftIndex],
    ];
  }
}

function formatInboxEntry(entry) {
  const createdAt = entry.createdAtMillis
    ? new Date(entry.createdAtMillis).toISOString()
    : null;

  return {
    ...entry.notification,
    priorityType: entry.priorityType,
    priorityRank: entry.priorityRank,
    normalizedCreatedAt: createdAt,
  };
}

function selectTopNotifications(notifications, limit = DEFAULT_TOP_LIMIT) {
  if (!Array.isArray(notifications)) {
    throw new TypeError('Notifications must be an array');
  }

  const priorityQueue = new BoundedPriorityQueue(limit);

  notifications.forEach((notification, sequence) => {
    const entry = createInboxEntry(notification, sequence);

    if (entry.priorityRank === 0) {
      return;
    }

    priorityQueue.push(entry);
  });

  return priorityQueue
    .toArray()
    .sort((left, right) => {
      if (isBetterNotification(left, right)) {
        return -1;
      }

      if (isBetterNotification(right, left)) {
        return 1;
      }

      return 0;
    })
    .map(formatInboxEntry);
}

async function fetchNotifications() {
  const { url, config } = getApiConfiguration();

  process.stdout.write(`\nURL: ${url}\n`);
  process.stdout.write(
    `Authorization: ${config.headers.Authorization.substring(0, 20)}...\n\n`,
  );

  try {
    const response = await axios.get(url, config);
    return extractNotifications(response.data);
  } catch (error) {
    process.stdout.write(
      `${JSON.stringify(
        {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        },
        null,
        2,
      )}\n`,
    );

    throw error;
  }
}

async function getPriorityInbox() {
  const notifications = await fetchNotifications();
  return selectTopNotifications(notifications, DEFAULT_TOP_LIMIT);
}

module.exports = {
  DEFAULT_TOP_LIMIT,
  PRIORITY_RANK,
  BoundedPriorityQueue,
  fetchNotifications,
  getPriorityInbox,
  selectTopNotifications,
};

if (require.main === module) {
  getPriorityInbox()
    .then((priorityInbox) => {
      process.stdout.write(
        `${JSON.stringify({ success: true, data: priorityInbox }, null, 2)}\n`,
      );
    })
    .catch((error) => {
      process.stderr.write(
        `${JSON.stringify({
          success: false,
          message: error.message,
        })}\n`,
      );
      process.exitCode = 1;
    });
}
