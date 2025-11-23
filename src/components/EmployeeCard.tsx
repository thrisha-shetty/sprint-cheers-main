import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Employee, AwardType } from "@/types/employee";
import { Award, Star } from "lucide-react";
import { awardCategories } from "@/data/mockData";

interface EmployeeCardProps {
  employee: Employee;
  onNominate: (employee: Employee, awardType: AwardType) => void;
  preselectedAward?: AwardType | null;
}

export const EmployeeCard = ({ employee, onNominate, preselectedAward }: EmployeeCardProps) => {
  return (
    <div className="group relative bg-card rounded-lg border shadow-card hover-lift transition-smooth cursor-pointer p-6">
      <div className="flex items-start gap-4">
        <Avatar className="w-16 h-16 border-2 border-primary">
          <AvatarImage src={employee.profilePicture} alt={employee.name} />
          <AvatarFallback>{employee.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{employee.name}</h3>
          <p className="text-sm text-muted-foreground truncate">{employee.jobTitle}</p>
          
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 text-accent fill-accent" />
              <span className="font-medium">{employee.totalScore}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Award className="w-4 h-4" />
              <span>{employee.badges.length} badges</span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      {employee.badges.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {employee.badges.slice(0, 3).map((badge) => {
            const category = awardCategories.find((c) => c.type === badge.type);
            return (
              <Badge
                key={badge.id}
                variant="secondary"
                className="text-xs"
                style={{
                  backgroundColor: category?.color ? `${category.color}20` : undefined,
                  borderColor: category?.color,
                }}
              >
                {badge.type}
              </Badge>
            );
          })}
          {employee.badges.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{employee.badges.length - 3} more
            </Badge>
          )}
        </div>
      )}

      {/* Nominate Button Overlay */}
      <div 
        className="absolute inset-0 bg-primary/90 rounded-lg opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center"
        onClick={() => {
          if (preselectedAward) {
            onNominate(employee, preselectedAward);
          }
        }}
      >
        <div className="text-center text-primary-foreground space-y-3">
          <Award className="w-12 h-12 mx-auto" />
          <p className="font-semibold text-lg">
            Nominate {employee.name.split(" ")[0]}
          </p>
          {preselectedAward ? (
            <>
              <p className="text-sm opacity-90">For {preselectedAward}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNominate(employee, preselectedAward);
                }}
                className="px-4 py-2 rounded-full bg-primary-foreground text-primary font-medium hover:scale-105 transition-smooth"
              >
                Nominate
              </button>
            </>
          ) : (
            <>
              <p className="text-sm opacity-90">Click to select an award</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4 px-4">
                {awardCategories.slice(0, 4).map((category) => (
                  <button
                    key={category.type}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNominate(employee, category.type);
                    }}
                    className="px-3 py-1 rounded-full bg-primary-foreground text-primary text-xs font-medium hover:scale-105 transition-smooth"
                  >
                    {category.type}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
