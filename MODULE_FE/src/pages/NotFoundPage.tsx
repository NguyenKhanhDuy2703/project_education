import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, BookOpen } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 space-y-5">
      <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
        <BookOpen className="size-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-6xl font-black tracking-tight text-primary">404</h1>
        <h2 className="text-xl font-bold text-foreground">Trang không tồn tại</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Trang bạn tìm kiếm có thể đã bị xóa, đổi tên, hoặc tạm thời không khả dụng.
        </p>
      </div>
      <Link to="/">
        <Button className="gap-2 font-semibold">
          <Home className="size-4" />
          Về trang chủ StudyIT
        </Button>
      </Link>
    </div>
  );
}
