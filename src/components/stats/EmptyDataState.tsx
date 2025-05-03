
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface EmptyDataStateProps {
  title: string;
  description: string;
  onAction?: () => void;
  actionLabel?: string;
  height?: string;
}

export const EmptyDataState = ({ 
  title, 
  description, 
  onAction, 
  actionLabel = "Réessayer", 
  height = "300px" 
}: EmptyDataStateProps) => {
  return (
    <Card className={`w-full flex items-center justify-center`} style={{ height }}>
      <CardContent className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <CardTitle className="mb-2">{title}</CardTitle>
        <CardDescription className="mb-4 max-w-md mx-auto">
          {description}
        </CardDescription>
        {onAction && (
          <Button
            variant="outline"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
