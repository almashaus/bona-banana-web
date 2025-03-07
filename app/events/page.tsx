// import Link from "next/link"
// import { CalendarDays, Filter, MapPin, Search } from "lucide-react"
// import { Card, CardContent, CardFooter } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { formatCurrency } from "@/lib/utils"
// import { events } from "@/data/events"

// export default function EventsPage() {
//   return (
//     <div className="container py-10">
//       <h1 className="text-3xl font-bold mb-6">All Events</h1>

//       {/* Search and Filter */}
//       <div className="flex flex-col md:flex-row gap-4 mb-8">
//         <div className="relative flex-1">
//           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
//           <Input type="search" placeholder="Search events..." className="w-full pl-8" />
//         </div>
//         <div className="flex flex-col sm:flex-row gap-2">
//           <Select defaultValue="all">
//             <SelectTrigger className="w-full sm:w-[180px]">
//               <SelectValue placeholder="Category" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All Categories</SelectItem>
//               <SelectItem value="music">Music</SelectItem>
//               <SelectItem value="sports">Sports</SelectItem>
//               <SelectItem value="arts">Arts</SelectItem>
//               <SelectItem value="food">Food</SelectItem>
//               <SelectItem value="business">Business</SelectItem>
//               <SelectItem value="technology">Technology</SelectItem>
//             </SelectContent>
//           </Select>
//           <Input type="date" className="w-full sm:w-[180px]" />
//           <Button variant="outline" className="flex items-center gap-2">
//             <Filter className="h-4 w-4" />
//             More Filters
//           </Button>
//         </div>
//       </div>

//       {/* Events Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//         {events.map((event) => (
//           <Link href={`/events/${event.id}`} key={event.id}>
//             <Card className="overflow-hidden h-full transition-all hover:shadow-lg">
//               <div className="aspect-video w-full overflow-hidden">
//                 <img
//                   src={event.image || "/placeholder.svg"}
//                   alt={event.name}
//                   className="h-full w-full object-cover transition-transform hover:scale-105"
//                 />
//               </div>
//               <CardContent className="p-4">
//                 <h3 className="line-clamp-1 text-lg font-bold">{event.name}</h3>
//                 <div className="mt-2 flex items-center text-sm text-muted-foreground">
//                   <CalendarDays className="mr-1 h-4 w-4" />
//                   {new Date(event.dates[0]).toLocaleDateString()}
//                 </div>
//                 <div className="mt-1 flex items-center text-sm text-muted-foreground">
//                   <MapPin className="mr-1 h-4 w-4" />
//                   {event.location}
//                 </div>
//               </CardContent>
//               <CardFooter className="p-4 pt-0 flex justify-between items-center">
//                 <Badge variant="outline">{event.category}</Badge>
//                 <span className="font-medium">{formatCurrency(event.price)}</span>
//               </CardFooter>
//             </Card>
//           </Link>
//         ))}
//       </div>
//     </div>
//   )
// }
