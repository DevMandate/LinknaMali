import React from "react";
import { Phone, Mail } from "lucide-react";

const ContactSection = () => {
  return (
    <div className="py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-8 md:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-2xl sm:text-4xl md:text-5xl font-light mb-4 sm:mb-6"
            style={{ color: "var(--text)" }}
          >
            Ready to Make This{" "}
            <span style={{ color: "var(--merime-theme)" }}>Home?</span>
          </h2>
          <p
            className="text-base sm:text-lg mb-8 sm:mb-10"
            style={{ color: "var(--text)" }}
          >
            Our team of experts is ready to help you find your perfect residence
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg flex items-center justify-center transition-all duration-300 hover:scale-105 text-white"
              style={{ backgroundColor: "var(--merime-theme)" }}
            >
              <Phone className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Call Now
            </button>
            <button
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-full border-2 font-semibold text-base sm:text-lg flex items-center justify-center transition-all duration-300 hover:scale-105"
              style={{
                borderColor: "var(--merime-theme)",
                color: "var(--merime-theme)",
              }}
            >
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSection;