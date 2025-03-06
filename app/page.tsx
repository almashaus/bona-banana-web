import Link from "next/link";
import { CalendarDays, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { events } from "@/data/events";

export default function Home() {
  const featuredEvents = events.slice(0, 6);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-muted/50 to-muted">
        <div className="container px-4 md:px-6">
          <div className="">
            <div className="flex flex-col justify-center items-center space-y-4">
              <div className="flex flex-col justify-center items-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter text-center sm:text-5xl xl:text-6xl/none">
                  Discover Events That Match Your Passion
                </h1>
                <p className="max-w-[800px] text-center text-muted-foreground md:text-xl">
                  Find and book tickets for concerts, sports, theater,
                  festivals, and more.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link
                  href="/events"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Browse Events
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Featured Events
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Discover the most popular events happening near you
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
            {featuredEvents.map((event) => (
              <Link href={`/events/${event.id}`} key={event.id}>
                <Card className="overflow-hidden transition-all hover:shadow-lg">
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={event.image || "/placeholder.svg"}
                      alt={event.name}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="line-clamp-1 text-lg font-bold">
                      {event.name}
                    </h3>
                    <div className="mt-2 flex items-center text-sm text-muted-foreground">
                      <CalendarDays className="mr-1 h-4 w-4" />
                      {new Date(event.dates[0]).toLocaleDateString()}
                    </div>
                    <div className="mt-1 flex items-center text-sm text-muted-foreground">
                      <MapPin className="mr-1 h-4 w-4" />
                      {event.location}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between items-center">
                    <Badge variant="outline">{event.category}</Badge>
                    <span className="font-medium">
                      {formatCurrency(event.price)}
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
          <div className="flex justify-center">
            <Button asChild>
              <Link href="/events">View All Events</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
