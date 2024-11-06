import { Icons } from '@/components/ui/Icons'
import { cn } from '@/lib/utils'
import * as React from 'react'
import hotToast, { Toaster as HotToaster } from 'react-hot-toast'
import Paragraph from './Paragraph'


export const Toaster = HotToaster

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  visible: boolean
}

export function Toast({ visible, className, ...props }: ToastProps) {
  return (
    <div
      className={cn(
        'min-h-16 mb-2 flex w-[350px] flex-col items-start gap-1 rounded-md bg-white px-6 py-4 shadow-lg',
        visible && 'animate-in slide-in-from-bottom-5',
        className
      )}
      {...props}
    />
  )
}

interface ToastIconProps extends Partial<React.SVGProps<SVGSVGElement>> {
  name: keyof typeof Icons
}

Toast.Icon = function ToastIcon({ name, className, ...props }: ToastIconProps) {
  const Icon = Icons[name]

  if (!Icon) {
    return null
  }

  const svgProps = {
    color: props.color,
    height: props.height,
  }

  return (
    <div className='flex h-20 w-20 items-center justify-center rounded-full bg-slate-100'>
      <Icon className={cn('h-10 w-10', className)} {...svgProps} />
    </div>
  )
}

interface ToastTitleProps extends React.HTMLAttributes<HTMLHeadingElement> { }

Toast.Title = function ToastTitle({ className, ...props }: ToastTitleProps) {
  return <p className={cn('text-sm font-medium', className)} {...props} />
}

interface ToastDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> { }

Toast.Description = function ToastDescription({
  className,
  ...props
}: ToastDescriptionProps) {
  return <p className={cn('text-sm opacity-80', className)} {...props} />
}

interface ToastOpts {
  title?: string
  message: string
  type?: 'success' | 'error' | 'default'
  link: string
  duration?: number
}

export function atoast(opts: ToastOpts) {
  const { title, message, link, type = 'default', duration = 3000 } = opts

  return hotToast.custom(({ visible }) => (
    <Toast
      visible={visible}
      className={cn({
        'bg-red-600 text-white': type === 'error',
        'bg-black text-white': type === 'success',
      })}
    >
      <div className="flex items-center">
        <img src={link} className="w-12 h-12 rounded-md mr-4" alt="Toast Icon" />
        <div className="flex flex-col">
          <div className="toast-title">
            <Paragraph>{title}</Paragraph>
            <Paragraph neon='blue'>New achievement unlocked!</Paragraph>
          </div>
          {message && (
            <div className="toast-description">
              <Paragraph size="small">{message}</Paragraph>
            </div>
          )}
        </div>
      </div>
    </Toast>
  ), { duration })
}
