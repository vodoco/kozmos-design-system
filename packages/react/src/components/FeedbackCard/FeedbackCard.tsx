import React, { useState } from "react";
import { cn } from "../../utils";
import { surfaceClass, type SurfaceVariant } from "../Surface";
import { Button } from "../Button";
import { CheckCircle } from "@kozmos-ds/icons";
import { Rating, type RatingVariant } from "../Rating";
import { Textarea } from "../Textarea";
import type { CharacterCount } from "../FieldWrapper/characterCount";
import { useKozmosAnalytics } from "../../utils/analytics";

export interface FeedbackCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** What the card sits on: solid by default, glass where the product asks for it. */
  surface?: SurfaceVariant;
  title?: string;
  description?: string;
  onSubmitFeedback?: (rating: number, comment: string) => void;
  isSubmitting?: boolean;
  successMessage?: string;
  /**
   * The scale. `thumbs` is the two-option form the Express Maps prompt uses —
   * "Are you enjoying this?" is a yes or a no, not a mark out of five.
   */
  variant?: RatingVariant;
  /** A character count on the comment, with the product's own limits. */
  count?: CharacterCount;
  /**
   * The words on the controls. They were fixed English inside the component,
   * so a visitor reading Arabic or Japanese got "Submit Feedback" whatever
   * the interface language — the same defect the search row had.
   */
  submitLabel?: string;
  submittingLabel?: string;
  commentPlaceholder?: string;
  /**
   * The heading level the card's title takes. A card can be a section of a
   * page or the whole of a dialog, and the level has to follow whatever
   * heading sits above it.
   */
  titleLevel?: 2 | 3 | 4 | 5 | 6;
}

const FeedbackCard = React.forwardRef<HTMLDivElement, FeedbackCardProps>(
  (
    {
      className,
      surface = "solid",
      title = "Rate your experience",
      description = "How was your navigation today?",
      onSubmitFeedback,
      isSubmitting = false,
      successMessage = "Thank you for the feedback!",
      variant = "stars",
      count,
      submitLabel = "Submit Feedback",
      submittingLabel = "Submitting...",
      commentPlaceholder = "Tell us more about your experience...",
      titleLevel = 3,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();
    const [rating, setRating] = useState<number>(0);
    const [comment, setComment] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const Heading = `h${titleLevel}` as "h3";

    const handleSubmit = () => {
      trackEvent("FeedbackCard", "feedback_submitted", { rating });
      onSubmitFeedback?.(rating, comment);
      setSubmitted(true);
    };

    return (
      <div
        ref={ref}
        className={cn(
          `${surfaceClass(surface)} shadow-overlay rounded-panel p-6 flex flex-col gap-4 transition-all duration-300`,
          className,
        )}
        {...props}
      >
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-center animate-in fade-in zoom-in duration-300">
            {/* The success tokens, not Tailwind's palette. This was
                bg-green-100 / dark:bg-green-900-30, which compile to a fixed
                rgb(220 252 231): a product that re-themed Kozmos got Tailwind
                green here and nowhere else. The mark was the emoji 🎉, which
                a screen reader reads as "party popper" and which renders as
                whatever the platform's font decides. */}
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-pill bg-success/10 text-success-text">
              <CheckCircle aria-hidden="true" className="h-6 w-6" />
            </div>
            <Heading className="font-semibold text-foreground text-lg">
              {successMessage}
            </Heading>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1.5 text-center">
              <Heading className="font-semibold text-lg text-foreground tracking-tight">
                {title}
              </Heading>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            <div className="flex justify-center py-4">
              <Rating
                onChange={(val) => setRating(val)}
                value={rating}
                variant={variant}
              />
            </div>

            <div className="flex flex-col gap-3">
              {/* The control radius and the standard focus ring, as every
                  field has. Until 2026-09-22 this was rounded-panel (24) with
                  ring-0, as the routing fields were: no visible focus. */}
              <Textarea
                count={count}
                placeholder={commentPlaceholder}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[80px] resize-none bg-black/5 dark:bg-white/10 border-transparent focus-visible:bg-black/10 dark:focus-visible:bg-white/20 transition-all duration-300"
              />
              <Button
                className="w-full font-medium"
                disabled={rating === 0 || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? submittingLabel : submitLabel}
              </Button>
            </div>
          </>
        )}
      </div>
    );
  },
);

FeedbackCard.displayName = "FeedbackCard";

export { FeedbackCard };
