export default function ErrorPage() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Something went wrong.</h1>
        <p className="text-sm text-muted-foreground">Please try again later.</p>
      </div>
    </div>
  );
}
