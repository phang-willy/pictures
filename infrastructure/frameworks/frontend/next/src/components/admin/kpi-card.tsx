import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type KpiCardProps = {
  title: string;
  subtitle?: string;
  value: number;
  icon?: React.ReactNode;
};

export function KpiCard({
  title,
  value,
  icon,
  subtitle
}: KpiCardProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="grid gap-2 text-sm font-medium">
          <div className="flex items-center gap-2">
            {icon}
            {title}
          </div>
          {subtitle && (
            <p className="text-muted-foreground text-xs">
              {subtitle}
            </p>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="text-3xl font-bold">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}