import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Employee, AwardType } from "@/types/employee";
import { Star, Send, Lock } from "lucide-react";
import { toast } from "sonner";
import { awardCategories } from "@/data/mockData";
import * as LucideIcons from "lucide-react";
import { auth, nominationStorage } from "@/lib/localStorage";

interface NominationModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  awardType: AwardType | null;
}

export const NominationModal = ({
  isOpen,
  onClose,
  employee,
  awardType,
}: NominationModalProps) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hasAlreadyVoted, setHasAlreadyVoted] = useState(false);

  // Check for existing vote whenever the modal opens or awardType changes
  useEffect(() => {
    if (isOpen && awardType) {
      const user = auth.getCurrentUser();
      if (user) {
        const alreadyVoted = nominationStorage.hasUserNominatedForAward(user.id, awardType);
        setHasAlreadyVoted(alreadyVoted);
      }
    }
  }, [isOpen, awardType]);

  if (!employee || !awardType) return null;

  const category = awardCategories.find((c) => c.type === awardType);
  const IconComponent = category
    ? (LucideIcons[category.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>)
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = auth.getCurrentUser();
    
    if (!user) {
      toast.error("You must be logged in to nominate");
      return;
    }

    // Double check strictly on submit
    if (nominationStorage.hasUserNominatedForAward(user.id, awardType)) {
      toast.error(`You have already cast a vote for ${awardType}`);
      return;
    }

    // Save nomination
    nominationStorage.addNomination(
      employee.id,
      user.id,
      awardType,
      comment,
      rating
    );

    toast.success(`Nomination sent to ${employee.name}!`, {
      description: `${awardType} • ${rating} stars • +${rating * 10} points`,
    });
    
    setRating(5);
    setComment("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {IconComponent && category && (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: category.color }}
              >
                <IconComponent className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <DialogTitle>Nominate {employee.name}</DialogTitle>
              <DialogDescription>{awardType}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {hasAlreadyVoted ? (
          // RESTRICTED VIEW: If they have already voted
          <div className="py-8 flex flex-col items-center text-center space-y-4">
             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
               <Lock className="w-8 h-8 text-gray-400" />
             </div>
             <div>
               <h3 className="text-lg font-semibold text-gray-900">Vote Already Cast</h3>
               <p className="text-sm text-gray-500 max-w-xs mx-auto mt-2">
                 You have already used your nomination for the <strong>{awardType}</strong> category. You cannot nominate another person for this award.
               </p>
             </div>
             <Button variant="outline" onClick={onClose} className="mt-4">
               Close
             </Button>
          </div>
        ) : (
          // NORMAL FORM VIEW
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-smooth hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? "text-accent fill-accent"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                placeholder="Share why they deserve this award..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="gradient-hero gap-2">
                <Send className="w-4 h-4" />
                Send Nomination
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};