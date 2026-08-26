"use client";
import { useStore } from '@/hooks/useStore';

export const Menu = () => {
    const resetWorld = useStore((state) => {
        if (!state) return () => {};
        return state.resetWorld;
    });

    const handleReset = () => {
        resetWorld();
        window.location.reload();
    };

    return (
        <div className="menu absolute">
            <button onClick={handleReset}>Reset</button>
        </div>
    );
};
