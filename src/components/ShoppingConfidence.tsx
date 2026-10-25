import { useBusiness } from "../context/Business";
import { MapPin, Truck, MessageCircle, ArrowUpRight } from "lucide-react";
import { enquiryWhatsApp } from "../lib/contact";

export default function ShoppingConfidence() {
  const business = useBusiness();
  return (
    <section
      className="shopping-confidence section-pad"
      aria-label="Shopping at a glance"
    >
      <div>
        <MapPin size={21} />
        <span>
          <strong>Hyderabad, this one’s for you.</strong>
          <small>Tropical Feast enquiries in Hyderabad only.</small>
        </span>
      </div>
      <div>
        <Truck size={21} />
        <span>
          <strong>Delivery by location. Confirmed in chat.</strong>
          <small>Delivery charges will be confirmed on WhatsApp.</small>
        </span>
      </div>
      <div>
        <MessageCircle size={21} />
        <span>
          <strong>A real conversation before you order.</strong>
          <small>Browse as a guest. Confirm stock & delivery in chat.</small>
        </span>
      </div>
      <a
        href={enquiryWhatsApp(
          "Hello! I’m in Hyderabad. Can you confirm delivery availability, timing, jar sizes and ingredients/allergens before I order?",
          `https://wa.me/${business.whatsapp}`,
        )!}
        target="_blank"
        rel="noopener noreferrer"
      >
        Ask about delivery <ArrowUpRight size={16} />
      </a>
    </section>
  );
}
