import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookMarked } from 'lucide-react';
import { Link } from 'react-router-dom';

export function UserSavedSeriesView() {
  return (
    <div className="space-y-6 max-w-5xl">
      <Card className="border-dashed border-2 border-border/80">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <BookMarked className="size-6" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-base font-semibold text-foreground">No saved series yet</h3>
            <p className="text-xs text-muted-foreground">
              Explore our comprehensive series catalog and bookmark topics you'd like to master.
            </p>
          </div>
          <Button size="sm" asChild className="text-xs font-semibold px-4">
            <Link to="/series">Explore Series Catalog</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
