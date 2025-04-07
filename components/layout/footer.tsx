export default function Footer() {
  return (
    <footer className="border-t py-6">
      <div className="container flex flex-col items-center justify-center gap-4 md:flex-row">
        <p className="text-center text-sm text-muted-foreground md:text-center">
          &copy; {new Date().getFullYear()} Bona Banana. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
