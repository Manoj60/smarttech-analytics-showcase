import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-primary group-[.toaster]:text-primary-foreground group-[.toaster]:border-primary/20 group-[.toaster]:shadow-medium",
          description: "group-[.toast]:text-primary-foreground/80",
          actionButton:
            "group-[.toast]:bg-primary-foreground group-[.toast]:text-primary",
          cancelButton:
            "group-[.toast]:bg-primary-foreground/10 group-[.toast]:text-primary-foreground",
          success: "group-[.toaster]:border-success group-[.toaster]:bg-success group-[.toaster]:text-success-foreground",
          error: "group-[.toaster]:border-destructive group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground",
          warning: "group-[.toaster]:border-warning group-[.toaster]:bg-warning group-[.toaster]:text-warning-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
