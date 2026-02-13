"use client"; // Required for Framer Motion in Next.js App Router

import React,{useState,useEffect} from "react";
import { motion } from "framer-motion";
import NavBar from "@/app/components/innernavbar/page";
import Footer from "@/app/components/footer/page";
import ChipLoader from "@/app/components/loader/page";
import {  AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";

// Animation Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};




const Contact = () => {

 const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
          >
            <div className="w-full max-w-md">
              <ChipLoader />
            </div>
          </motion.div>
        )}
      </AnimatePresence>{" "}    <div className="flex flex-col min-h-screen font-sans overflow-x-hidden">
      <NavBar />

      {/* Hero Section */}
      <section
        className="relative h-[450px] bg-cover bg-center flex items-center justify-center text-white"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?auto=format&fit=crop&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-purple-950/70"></div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="relative z-10 text-center px-4"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact us</h1>
          <p className="text-lg max-w-lg mx-auto opacity-90">
            Skill Swap is ready to provide the right solution according to your
            needs.
          </p>
        </motion.div>
      </section>

      {/* Main Contact Card Section */}
      <section className="relative -mt-32 pb-20 px-4 z-20">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl flex flex-col md:row overflow-hidden"
        >
          <div className="flex flex-col md:flex-row">
            {/* Left Column: Get in touch */}
            <div className="md:w-1/2 p-8 md:p-16">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                <motion.h2
                  variants={fadeInUp}
                  className="text-3xl font-bold text-gray-800 mb-4"
                >
                  Get in touch
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-gray-500 mb-10">
                  Have questions? Our team is here to help you navigate your
                  payment solutions.
                </motion.p>

                <div className="space-y-8">
                  {[
                    {
                      icon: MapPin,
                      title: "Head Office",
                      detail: "Lapo Digital Tower, Jakarta - Indonesia",
                    },
                    {
                      icon: Mail,
                      title: "Email Us",
                      detail: "support@kassapay.co.id",
                    },
                    {
                      icon: Phone,
                      title: "Call Us",
                      detail: "Phone : +62 21 000 0000",
                    },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      variants={fadeInUp}
                      className="flex items-start gap-5"
                    >
                      <div className="bg-purple-600 p-3 rounded-full text-white shadow-lg shadow-blue-200">
                        <item.icon size={22} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">
                          {item.title}
                        </h4>
                        <p className="text-gray-600 text-sm mt-1">
                          {item.detail}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div variants={fadeInUp} className="mt-12">
                  <p className="font-bold text-gray-800 mb-5">
                    Follow our social media
                  </p>
                  <div className="flex gap-4">
                    {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                      <motion.a
                        key={i}
                        href="#"
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        className="bg-purple-600 p-2.5 rounded-full text-white hover:bg-purple-700 transition shadow-md"
                      >
                        <Icon size={20} />
                      </motion.a>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Right Column: Message Form */}
            <div className="md:w-1/2 bg-slate-50 p-8 md:p-16">
              <h2 className="text-2xl font-bold text-gray-800 mb-8">
                Send us a message
              </h2>
              <form className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input
                    type="text"
                    placeholder="Name"
                    className="w-full p-4 bg-gray-100 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                  />
                  <input
                    type="text"
                    placeholder="Company"
                    className="w-full p-4 bg-gray-100 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input
                    type="text"
                    placeholder="Phone"
                    className="w-full p-4 bg-gray-100 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full p-4 bg-gray-100 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Subject"
                  className="w-full p-4 bg-gray-100 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                />
                <textarea
                  placeholder="Message"
                  rows="4"
                  className="w-full p-4 bg-gray-100 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                ></textarea>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-purple-950 to-pink-600 text-white font-bold py-4 rounded-xl transition shadow-xl shadow-blue-200 cursor-pointer"
                >
                  Send Message
                </motion.button>
              </form>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Map Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        className="w-full h-[450px] grayscale contrast-125 brightness-100"
      >
        <iframe
          title="Lahore Map"
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d217759.99380853778!2d74.3343893!3d31.482940349999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39190483e58107d9%3A0xc23abe6ccc7e2462!2sLahore%2C%20Pakistan!5e0!3m2!1sen!2s!4v1770810676191!5m2!1sen!2s"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </motion.section>

      <Footer />
    </div>
    </>
  );
};

export default Contact;
