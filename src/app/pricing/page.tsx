"use client";

import React from "react";
import Link from "next/link";

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      desc: "Perfect for getting started",
      features: [
        "Basic access",
        "Limited features",
        "Community support",
      ],
      btn: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: "$19",
      desc: "Best for professionals",
      features: [
        "All Free features",
        "Unlimited access",
        "Priority support",
        "Advanced tools",
      ],
      btn: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$49",
      desc: "For teams & businesses",
      features: [
        "All Pro features",
        "Team collaboration",
        "Dedicated support",
        "Custom solutions",
      ],
      btn: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <section className="bg-gradient-to-b from-purple-50 to-white py-16 px-4">
      <div className="max-w-7xl mx-auto text-center">
        {/* Heading */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
          Simple & Transparent Pricing
        </h1>
        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
          Choose the plan that fits your needs. No hidden charges.
        </p>

        {/* Pricing Cards */}
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-2xl border p-8 shadow-sm bg-white
                ${
                  plan.popular
                    ? "border-purple-600 shadow-lg scale-105"
                    : "border-gray-200"
                }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}

              <h3 className="text-xl font-semibold text-gray-900">
                {plan.name}
              </h3>
              <p className="mt-2 text-gray-500">{plan.desc}</p>

              <div className="mt-6">
                <span className="text-4xl font-extrabold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-gray-500"> / month</span>
              </div>

              {/* Features */}
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-purple-600">✔</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Button */}
              <Link
                href="/signup"
                className={`mt-8 block text-center rounded-md px-6 py-3 font-medium transition
                  ${
                    plan.popular
                      ? "bg-gradient-to-r from-purple-950 to-pink-600 text-white hover:opacity-90"
                      : "border border-purple-600 text-purple-600 hover:bg-purple-50"
                  }`}
              >
                {plan.btn}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
