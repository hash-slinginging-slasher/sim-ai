/**
 * Internal Polling Service
 *
 * Runs scheduled tasks internally within the Next.js app
 * No external dependencies or cost - runs in the same container
 */

import { createLogger } from '@/lib/logs/console/logger'
import { env } from '@/lib/env'

const logger = createLogger('InternalPoller')

class InternalPoller {
  private scheduleIntervalId: NodeJS.Timeout | null = null
  private outlookIntervalId: NodeJS.Timeout | null = null
  private isRunning = false

  /**
   * Start the internal polling service
   */
  start() {
    console.log('[InternalPoller] start() called')
    if (this.isRunning) {
      console.log('[InternalPoller] Already running, skipping')
      logger.warn('Internal poller already running')
      return
    }

    console.log('[InternalPoller] Starting internal polling service...')
    logger.info('Starting internal polling service...')
    this.isRunning = true

    // Schedule execution - check every minute
    this.scheduleIntervalId = setInterval(async () => {
      await this.pollSchedules()
    }, 60 * 1000) // 60 seconds

    // Outlook polling - check every minute
    this.outlookIntervalId = setInterval(async () => {
      await this.pollOutlook()
    }, 60 * 1000) // 60 seconds

    // Run immediately on startup
    setTimeout(() => this.pollSchedules(), 5000) // After 5 seconds
    setTimeout(() => this.pollOutlook(), 10000) // After 10 seconds

    console.log('[InternalPoller] Service started successfully')
    logger.info('Internal polling service started successfully')
    logger.info('- Schedule polling: every 60 seconds')
    logger.info('- Outlook polling: every 60 seconds')
    console.log('[InternalPoller] Timers set: schedules in 5s, outlook in 10s')
  }

  /**
   * Stop the polling service
   */
  stop() {
    if (!this.isRunning) {
      return
    }

    logger.info('Stopping internal polling service...')

    if (this.scheduleIntervalId) {
      clearInterval(this.scheduleIntervalId)
      this.scheduleIntervalId = null
    }

    if (this.outlookIntervalId) {
      clearInterval(this.outlookIntervalId)
      this.outlookIntervalId = null
    }

    this.isRunning = false
    logger.info('Internal polling service stopped')
  }

  /**
   * Poll for scheduled workflows
   */
  private async pollSchedules() {
    try {
      const appUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const cronSecret = env.CRON_SECRET

      if (!cronSecret) {
        logger.warn('CRON_SECRET not configured - skipping schedule polling')
        return
      }

      const url = `${appUrl}/api/schedules/execute`

      logger.debug('Polling schedules...')

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
        },
      })

      if (!response.ok) {
        logger.error(`Schedule polling failed: ${response.status} ${response.statusText}`)
        return
      }

      const data = await response.json()

      if (data.executedCount > 0) {
        logger.info(`Schedule poll completed: ${data.executedCount} workflows executed`)
      } else {
        logger.debug('Schedule poll completed: no workflows due')
      }
    } catch (error) {
      logger.error('Error polling schedules:', error)
    }
  }

  /**
   * Poll for Outlook emails
   */
  private async pollOutlook() {
    try {
      const appUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const cronSecret = env.CRON_SECRET

      if (!cronSecret) {
        logger.warn('CRON_SECRET not configured - skipping Outlook polling')
        return
      }

      const url = `${appUrl}/api/webhooks/poll/outlook`

      logger.debug('Polling Outlook...')

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
        },
      })

      if (!response.ok) {
        logger.error(`Outlook polling failed: ${response.status} ${response.statusText}`)
        return
      }

      const data = await response.json()

      if (data.total > 0) {
        logger.info(`Outlook poll completed: ${data.total} webhooks checked, ${data.successful} successful`)
      } else {
        logger.debug('Outlook poll completed: no active webhooks')
      }
    } catch (error) {
      logger.error('Error polling Outlook:', error)
    }
  }
}

// Create singleton instance
export const internalPoller = new InternalPoller()
