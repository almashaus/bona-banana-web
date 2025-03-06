export type Event = {
  id: string
  name: string
  description: string
  image: string
  dates: string[]
  location: string
  venue: string
  category: string
  price: number
  capacity: number
  availableTickets: number
}

export const events: Event[] = [
  {
    id: "1",
    name: "Summer Music Festival",
    description:
      "Join us for three days of amazing music performances from top artists across multiple genres. Enjoy food vendors, art installations, and a vibrant festival atmosphere.",
    image: "/placeholder.svg?height=400&width=600&text=Summer+Music+Festival",
    dates: ["2023-07-15", "2023-07-16", "2023-07-17"],
    location: "New York, NY",
    venue: "Central Park",
    category: "Music",
    price: 149.99,
    capacity: 5000,
    availableTickets: 2500,
  },
  {
    id: "2",
    name: "Tech Conference 2023",
    description:
      "The premier tech conference featuring keynotes from industry leaders, workshops on cutting-edge technologies, and networking opportunities with professionals from around the world.",
    image: "/placeholder.svg?height=400&width=600&text=Tech+Conference",
    dates: ["2023-09-10", "2023-09-11", "2023-09-12"],
    location: "San Francisco, CA",
    venue: "Moscone Center",
    category: "Technology",
    price: 299.99,
    capacity: 3000,
    availableTickets: 1200,
  },
  {
    id: "3",
    name: "Basketball Championship",
    description:
      "Watch the final match of the national basketball championship. See the top teams compete for the championship title in this exciting sporting event.",
    image: "/placeholder.svg?height=400&width=600&text=Basketball+Championship",
    dates: ["2023-06-30"],
    location: "Chicago, IL",
    venue: "United Center",
    category: "Sports",
    price: 89.99,
    capacity: 20000,
    availableTickets: 5000,
  },
  {
    id: "4",
    name: "Food & Wine Festival",
    description:
      "Indulge in culinary delights from renowned chefs, taste premium wines, and enjoy cooking demonstrations at this gastronomic celebration.",
    image: "/placeholder.svg?height=400&width=600&text=Food+and+Wine+Festival",
    dates: ["2023-08-05", "2023-08-06"],
    location: "Napa Valley, CA",
    venue: "Napa Valley Expo",
    category: "Food",
    price: 129.99,
    capacity: 2000,
    availableTickets: 800,
  },
  {
    id: "5",
    name: "Broadway Musical: Hamilton",
    description:
      "Experience the award-winning musical that has taken the world by storm. This revolutionary tale of America's fiery past is told through the sounds of the ever-changing nation we've become.",
    image: "/placeholder.svg?height=400&width=600&text=Hamilton+Musical",
    dates: ["2023-07-01", "2023-07-02", "2023-07-08", "2023-07-09"],
    location: "New York, NY",
    venue: "Richard Rodgers Theatre",
    category: "Arts",
    price: 199.99,
    capacity: 1300,
    availableTickets: 300,
  },
  {
    id: "6",
    name: "Business Leadership Summit",
    description:
      "Connect with industry leaders, gain insights from expert speakers, and develop your leadership skills at this premier business event.",
    image: "/placeholder.svg?height=400&width=600&text=Business+Summit",
    dates: ["2023-10-15", "2023-10-16"],
    location: "Boston, MA",
    venue: "Boston Convention Center",
    category: "Business",
    price: 249.99,
    capacity: 1500,
    availableTickets: 900,
  },
  {
    id: "7",
    name: "Comic Con 2023",
    description:
      "The ultimate pop culture convention featuring celebrity guests, comic artists, cosplay competitions, exclusive merchandise, and panels on your favorite movies, TV shows, and comics.",
    image: "/placeholder.svg?height=400&width=600&text=Comic+Con",
    dates: ["2023-08-25", "2023-08-26", "2023-08-27"],
    location: "San Diego, CA",
    venue: "San Diego Convention Center",
    category: "Entertainment",
    price: 79.99,
    capacity: 10000,
    availableTickets: 3000,
  },
  {
    id: "8",
    name: "Wellness Retreat",
    description:
      "Rejuvenate your mind, body, and spirit with yoga sessions, meditation workshops, healthy cuisine, and wellness seminars led by expert practitioners.",
    image: "/placeholder.svg?height=400&width=600&text=Wellness+Retreat",
    dates: ["2023-09-22", "2023-09-23", "2023-09-24"],
    location: "Sedona, AZ",
    venue: "Sedona Retreat Center",
    category: "Wellness",
    price: 349.99,
    capacity: 500,
    availableTickets: 200,
  },
]

