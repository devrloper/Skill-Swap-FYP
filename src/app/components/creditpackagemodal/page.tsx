"use client";

import React from "react";
import { PAID_CREDIT_PACKS } from "@/app/lib/creditConstants";
import { useStripeCheckout } from "@/app/hooks/useStripeCheckout";
import { IoClose } from "react-icons/io5";
import toast from "react-hot-toast";

type PackId = keyof typeof PAID_CREDIT_PACKS;

interface CreditPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPack?: PackId;
}

export default function CreditPackageModal({
  isOpen,
  onClose,
  selectedPack,
}: CreditPackageModalProps) {
  const { initiateCheckout, loading, error } = useStripeCheckout();

  if (!isOpen) return null;

  const handlePurchase = async (packId: PackId) => {
    await initiateCheckout(packId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            Choose Your Credit Package
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.entries(PAID_CREDIT_PACKS) as [PackId, (typeof PAID_CREDIT_PACKS)[PackId]][]).map(
              ([packId, pack]) => (
                <div
                  key={packId}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                    selectedPack === packId
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {pack.label}
                    </h3>
                    <p className="text-3xl font-bold text-blue-600 mb-2">
                      {pack.credits}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">Credits</p>
                    <p className="text-xl font-bold text-gray-800 mb-4">
                      PKR {pack.price.toLocaleString()}
                    </p>
                    <button
                      onClick={() => handlePurchase(packId)}
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded transition"
                    >
                      {loading ? "Processing..." : "Buy Now"}
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Secure payment powered by Stripe. Your credit card information is
            safely encrypted.
          </p>
        </div>
      </div>
    </div>
  );
}
