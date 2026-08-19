import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, Calendar, UserPlus } from 'lucide-react'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/notifications/hooks/useNotifications'
import { resolveMemberDisplayName } from '@/utils/displayName'
import { cn } from '@/utils/cn'
import type { NotificationDto } from '@/features/notifications/types'

function notificationHref(notification: NotificationDto): string | null {
  if (notification.type === 'NEW_EVENT' && notification.event) {
    return `/evenements/${notification.event.id}`
  }
  if (notification.type === 'NEW_MEMBER' && notification.relatedUser) {
    return `/admin/membres/${notification.relatedUser.id}`
  }
  return null
}

interface NotificationItemProps {
  notification: NotificationDto
  onNavigate: (id: string) => void
}

function NotificationItem({ notification, onNavigate }: NotificationItemProps) {
  const { t, i18n } = useTranslation()
  const href = notificationHref(notification)
  const isUnread = !notification.readAt

  const label =
    notification.type === 'NEW_EVENT'
      ? t('notifications.newEvent', {
          title: notification.event
            ? i18n.language === 'ar'
              ? notification.event.titleAr
              : notification.event.titleFr
            : '',
        })
      : t('notifications.newMember', {
          name: notification.relatedUser
            ? resolveMemberDisplayName(notification.relatedUser, i18n.language)
            : '',
        })

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 text-start text-sm hover:bg-slate-50',
        isUnread && 'bg-primary/5',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          notification.type === 'NEW_EVENT'
            ? 'bg-primary/10 text-primary'
            : 'bg-secondary/10 text-secondary',
        )}
      >
        {notification.type === 'NEW_EVENT' ? <Calendar size={16} /> : <UserPlus size={16} />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className={cn('text-slate-700', isUnread && 'font-semibold text-slate-900')}>{label}</p>
        <p className="text-xs text-slate-400">
          {new Date(notification.createdAt).toLocaleString(
            i18n.language === 'ar' ? 'ar-TN' : 'fr-TN',
          )}
        </p>
      </div>
      {isUnread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
    </div>
  )

  if (href) {
    return (
      <Link to={href} onClick={() => onNavigate(notification.id)}>
        {content}
      </Link>
    )
  }
  // No target to navigate to (the referenced event/member row no longer
  // exists) — still needs to be a real interactive element, not a bare div
  // with an onClick, so it stays keyboard-reachable and matches the
  // Link's semantics above.
  return (
    <button type="button" className="w-full text-start" onClick={() => onNavigate(notification.id)}>
      {content}
    </button>
  )
}

export function NotificationBell() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const bellButtonRef = useRef<HTMLButtonElement>(null)

  const { data } = useNotifications(true)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const notifications = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        bellButtonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function handleItemClick(id: string) {
    setOpen(false)
    const notification = notifications.find((item) => item.id === id)
    if (notification && !notification.readAt) {
      markRead.mutate(id)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={bellButtonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t('notifications.bellLabel')}
        aria-expanded={open}
        className="relative rounded-xl p-2 text-slate-700 hover:bg-slate-100"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 max-h-[28rem] w-80 overflow-y-auto rounded-xl border border-slate-200 bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{t('notifications.title')}</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="text-xs font-medium text-primary hover:underline"
              >
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              {t('notifications.empty')}
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onNavigate={handleItemClick}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
