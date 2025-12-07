import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AnalysisContextType {
    results: any | null;
    setResults: (results: any | null) => void;
    isAnalyzing: boolean;
    setIsAnalyzing: (isAnalyzing: boolean) => void;
    isBackgroundUpdating: boolean;
    setIsBackgroundUpdating: (isBackgroundUpdating: boolean) => void;
    pendingProfileUpdate: boolean;
    setPendingProfileUpdate: (pending: boolean) => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider = ({ children }: { children: ReactNode }) => {
    const [results, setResults] = useState<any | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isBackgroundUpdating, setIsBackgroundUpdating] = useState(false);
    const [pendingProfileUpdate, setPendingProfileUpdate] = useState(false);

    return (
        <AnalysisContext.Provider value={{
            results, setResults,
            isAnalyzing, setIsAnalyzing,
            isBackgroundUpdating, setIsBackgroundUpdating,
            pendingProfileUpdate, setPendingProfileUpdate
        }}>
            {children}
        </AnalysisContext.Provider>
    );
};

export const useAnalysis = () => {
    const context = useContext(AnalysisContext);
    if (context === undefined) {
        throw new Error('useAnalysis must be used within an AnalysisProvider');
    }
    return context;
};
