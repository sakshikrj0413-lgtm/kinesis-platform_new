import { create } from "zustand";
import { persist } from "zustand/middleware";

const useWalletStore = create(
  persist(
    (set, get) => ({
      walletAddress: null,
      isConnected: false,
      chainId: null,
      connectedAt: null,

      setWallet: (address, chainId) => {
        set({
          walletAddress: address,
          chainId: chainId,
          isConnected: !!address,
          connectedAt: address ? new Date().toISOString() : null,
        });
      },

      clearWallet: () => {
        set({
          walletAddress: null,
          isConnected: false,
          chainId: null,
          connectedAt: null,
        });
      },

      updateChainId: (chainId) => {
        set({ chainId });
      },
    }),
    {
      name: "wallet-storage",
      partialize: (state) => ({
        walletAddress: state.walletAddress,
        chainId: state.chainId,
        connectedAt: state.connectedAt,
      }),
    }
  )
);

export default useWalletStore;