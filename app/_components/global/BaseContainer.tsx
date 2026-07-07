import React from "react";

type BaseContainerProps = {
    className?: string;
    children?: React.ReactNode;
};

export default function BaseContainer({ className = '', children }: BaseContainerProps) {
    return (
        // Reducimos pb-24 a pb-16 en mobile para evitar el exceso de espacio en pantallas cortas
        <div className={`w-full max-w-7xl mx-auto my-4 pb-16 md:pb-6 px-0 sm:px-6 ${className}`}>
            <div className="w-full bg-white p-4 border-b border-slate-200 shadow-xs md:rounded-2xl md:border md:p-6 md:shadow-sm">
                {children}
            </div>
        </div>
    )
}
