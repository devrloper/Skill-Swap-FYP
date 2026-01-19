"use client";
import Image from "next/image";
import { useState } from "react";
import Modal from "@/app/Modals/profilemodal/page"
export default function HeroSection() {
  const [open, setOpen] = useState(false);

  return (
    <>
    <section className="bg-[#fdf4ff] min-h-screen flex flex-col-reverse lg:flex-row items-center justify-center px-6 sm:px-10 lg:px-20 py-10">
      {/* LEFT CONTENT */}
      <div className="w-full lg:w-1/2 text-center lg:text-left space-y-6 mt-10 lg:mt-0">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
          Develop your skills in a new and unique way
        </h1>

        <p className="text-gray-600 text-sm sm:text-base md:text-lg max-w-md mx-auto lg:mx-0">
          Choose a better future. Upgrade your skills and become the person
          you&apos;ve always wanted to be. Our unique approach to online
          education helps you succeed.
        </p>

        <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
          <button
            onClick={() => setOpen(true)}
            className="bg-gradient-to-r  from-purple-950 cursor-pointer to-pink-600 text-white px-6 py-3 rounded-full font-medium shadow-md hover:opacity-90 transition-all">
            Enroll Now
          </button>
          <button className="text-pink-600 font-medium flex items-center justify-center space-x-1 hover:underline">
            <span>More Details</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* RIGHT IMAGE */}
      <div className="w-full lg:w-1/2 flex justify-center relative">
        <div className="relative w-72 sm:w-80 md:w-96 flip-scale-2-hor-top">
          <Image
            src="/Landing_1.png"
            alt="Student learning online"
            width={400}
            height={400}
            className="object-contain rounded-xl w-full h-auto"
            priority
          />

          
        </div>
      </div>
    </section>
          <Modal open={open} setOpen={setOpen} />
          </>

  );
}
