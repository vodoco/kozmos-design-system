import React, { forwardRef } from "react";
import { cn } from "../../utils";
import { Card, CardContent, CardFooter, CardHeader } from "../Card/Card";
import { Heading } from "../Heading/Heading";
import { Text } from "../Text/Text";
import { useKozmosAnalytics } from "../../utils/analytics";
import { DensityScope } from "../../theme/DensityScope";

export interface POICardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onClick"
> {
  imageUrl?: string;
  imageAlt?: string;
  title: string;
  subtitle?: string;
  description?: React.ReactNode;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  selectionLabel?: string;
}

export const POICard = forwardRef<HTMLDivElement, POICardProps>(
  (
    {
      className,
      imageUrl,
      title,
      imageAlt = title,
      subtitle,
      description,
      badges,
      actions,
      onClick,
      selectionLabel,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();

    const identity = (
      <>
        {imageUrl && (
          <div className="relative h-48 w-full overflow-hidden bg-muted">
            <img
              alt={imageAlt}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              src={imageUrl}
            />
          </div>
        )}

        <CardHeader className={cn("pb-2", imageUrl ? "pt-5" : "")}>
          <div className="flex flex-col gap-1.5">
            <Heading className="text-xl tracking-tight" level={3}>
              {title}
            </Heading>
            {subtitle && (
              <Text className="text-sm font-medium text-muted-foreground">
                {subtitle}
              </Text>
            )}
          </div>
          {badges && (
            <div className="mt-3 flex flex-wrap gap-2 text-sm">{badges}</div>
          )}
        </CardHeader>

        {description && (
          <CardContent className="py-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </CardContent>
        )}
      </>
    );

    return (
      // The SDK's touch geometry under any density (decision 82).
      <DensityScope density="touch" asChild>
        <Card
          ref={ref}
          className={cn("flex flex-col overflow-hidden", className)}
          role="article"
          {...props}
        >
          {onClick ? (
            <button
              aria-label={selectionLabel}
              className="group w-full text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              onClick={(event) => {
                trackEvent("POICard", "poi_selected", { title, subtitle });
                onClick(event);
              }}
              type="button"
            >
              {identity}
            </button>
          ) : (
            <div>{identity}</div>
          )}

          {actions && (
            <CardFooter className="flex flex-wrap gap-3 pb-5 pt-4">
              {actions}
            </CardFooter>
          )}
        </Card>
      </DensityScope>
    );
  },
);

POICard.displayName = "POICard";
