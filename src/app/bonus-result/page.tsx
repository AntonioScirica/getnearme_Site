'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    PartyPopper,
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    Ban,
    ChevronRight
} from 'lucide-react';

function BonusResultContent() {
    const searchParams = useSearchParams();
    const status = searchParams.get('status');

    // Success Params
    const credits = searchParams.get('credits');
    const streakDayStr = searchParams.get('streak_day');
    const nextStreak = searchParams.get('next_streak');
    const streakDay = streakDayStr ? parseInt(streakDayStr, 10) : 0;

    // Error Params
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    const containerClass = "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4";
    const cardClass = "bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up";

    if (status === 'success') {
        const isWeekComplete = streakDay >= 7;

        return (
            <div className={containerClass}>
                <div className={cardClass}>
                    {/* Header */}
                    <div className="bg-emerald-500 p-6 text-center text-white">
                        <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
                            <PartyPopper className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold">
                            {credits} Crediti Riscossi!
                        </h1>
                    </div>

                    <div className="p-8">
                        {/* Streak Visualization */}
                        <div className="flex justify-between items-center mb-8 px-2">
                            {Array.from({ length: 7 }).map((_, i) => {
                                const day = i + 1;
                                const isCompleted = day <= streakDay;
                                const isCurrent = day === streakDay;

                                let dotClass = "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300";

                                if (isCurrent) {
                                    // "quello attuale in giallo" -> implied distinction, maybe pulse or different color?
                                    // Requirement: "completati in verde, quello attuale in giallo"
                                    // If current is completed (it is), user wants it yellow.
                                    dotClass += " bg-yellow-400 text-yellow-900 ring-4 ring-yellow-100 scale-110 z-10 font-bold";
                                } else if (isCompleted) {
                                    dotClass += " bg-emerald-500 text-white";
                                } else {
                                    dotClass += " bg-gray-100 text-gray-400";
                                }

                                return (
                                    <div key={day} className="flex flex-col items-center gap-1">
                                        <div className={dotClass}>
                                            {isCompleted ? <CheckCircle className="w-5 h-5" /> : day}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Message */}
                        <div className="text-center mb-8">
                            <p className="text-gray-600 text-lg mb-2">
                                Giorno <span className="font-bold text-gray-900">{streakDay}</span> completato!
                            </p>
                            {isWeekComplete ? (
                                <p className="text-emerald-600 font-medium">
                                    Fantastico! Hai completato la settimana! Ricevi 120 crediti bonus!
                                </p>
                            ) : (
                                <p className="text-gray-500">
                                    Torna domani per il giorno {nextStreak}.
                                </p>
                            )}
                        </div>

                        {/* CTA */}
                        <Link
                            href="/"
                            className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center font-semibold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg shadow-indigo-200"
                        >
                            Vai a GetNearMe
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        let errorTitle = "Errore";
        let errorMessage = "Si è verificato un errore.";
        let Icon = AlertCircle;
        let headerColor = "bg-red-500";

        switch (error) {
            case 'already_claimed':
                errorTitle = "Bonus Già Riscosso";
                errorMessage = "Hai già riscosso il bonus di oggi. Torna domani!";
                Icon = CheckCircle; // Or generic info? Requirement says "Red header with appropriate icon". 
                // already_claimed implies success was past. But requirement says "Caso ERRORE ... already_claimed".
                // Use CheckCircle but potentially in a 'warning' context? Or sticking to Red as requested.
                Icon = Clock;
                break;
            case 'expired':
                errorTitle = "Token Scaduto";
                errorMessage = "Questo link non è più valido. Controlla l'email di oggi.";
                Icon = Clock;
                break;
            case 'invalid_token':
                errorTitle = "Token Non Valido";
                errorMessage = "Il link che hai usato non è valido.";
                Icon = Ban;
                break;
            case 'missing_token':
                errorTitle = "Token Mancante";
                errorMessage = "Nessun token fornito.";
                Icon = AlertCircle;
                break;
            case 'server_error':
                errorTitle = "Errore Server";
                errorMessage = "Si è verificato un errore. Riprova più tardi.";
                Icon = XCircle;
                break;
            default:
                // Use provided message if available
                if (message) errorMessage = message;
                break;
        }

        return (
            <div className={containerClass}>
                <div className={cardClass}>
                    {/* Header */}
                    <div className={`${headerColor} p-6 text-center text-white`}>
                        <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
                            <Icon className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold">
                            {errorTitle}
                        </h1>
                    </div>

                    <div className="p-8 text-center">
                        <p className="text-gray-600 text-lg mb-8">
                            {errorMessage}
                        </p>

                        <Link
                            href="/"
                            className="block w-full bg-gray-900 hover:bg-gray-800 text-white text-center font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
                        >
                            Torna alla Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Loading / Default state
    return (
        <div className={containerClass}>
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-4 bg-gray-300 rounded w-32 mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-48"></div>
            </div>
        </div>
    );
}

export default function BonusResultPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">Loading...</div>}>
            <BonusResultContent />
        </Suspense>
    );
}
