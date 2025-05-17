import { MailIcon } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-greenColor text-white py-6">
      <div className="container flex flex-col items-center justify-between gap-6 ">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <img src="/logo.svg" alt="Bona Banana Logo" className="h-20" />
        </div>

        {/* Social Media */}
        <div className="flex items-center gap-4">
          <a
            href="https://whatsapp.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-75"
          >
            <img src="/icons/whatsapp.svg" alt="Whatsapp" className="h-6" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-75"
          >
            <MailIcon className="h-6" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-75"
          >
            <img src="/icons/instagram.svg" alt="Instagram" className="h-6" />
          </a>
        </div>
      </div>

      {/* Links */}
      <div className="flex flex-col items-center gap-4 mt-6">
        <a href="/about-us" className="text-sm hover:underline">
          About Us
        </a>
        <a href="/contact-us" className="text-sm hover:underline">
          Contact Us
        </a>
        <a href="/privacy-policy" className="text-sm hover:underline">
          Privacy Policy
        </a>
      </div>

      <div className="mt-6 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Bona Banana. All rights reserved.
      </div>
    </footer>
  );
}
