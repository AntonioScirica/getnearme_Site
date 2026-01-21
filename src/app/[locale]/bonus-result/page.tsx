'use client';

import { Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import {
    PartyPopper,
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    Ban
} from 'lucide-react';
import { translations } from '@/lib/translations';
import { type Locale } from '@/lib/i18n';
import Navbar from '@/components/Navbar';

function BonusResultContent() {
    const searchParams = useSearchParams();
    const params = useParams();
    const locale = (params.locale as Locale) || 'it';
    const t = translations[locale];

    const status = searchParams.get('status');

    // Success Params
    const credits = searchParams.get('credits');
    const streakDayStr = searchParams.get('streak_day');
    const nextStreak = searchParams.get('next_streak');
    const streakDay = streakDayStr ? parseInt(streakDayStr, 10) : 0;

    // Error Params
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (status === 'success') {
        const isWeekComplete = streakDay >= 7;

        return (
            <div className="min-h-screen bg-white font-sans text-slate-900">
                <Navbar locale={locale} />

                <main className="min-h-screen flex items-center justify-center px-4">
                    <div className="max-w-2xl mx-auto text-center">
                        {/* Icon */}
                        <div className="mb-4 flex justify-center">
                            <PartyPopper className="w-14 h-14 text-blue-500" />
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl text-slate-900 font-bold mb-2">
                            {credits} {t.bonus.creditsClaimed}
                        </h1>

                        {/* Streak Visualization */}
                        <div className="flex justify-center items-center gap-3 my-8">
                            {Array.from({ length: 7 }).map((_, i) => {
                                const day = i + 1;
                                const isCompleted = day <= streakDay;
                                const isCurrent = day === streakDay;

                                let dotClass = "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300";

                                if (isCurrent) {
                                    dotClass += " bg-blue-500 text-white ring-4 ring-blue-100 scale-110";
                                } else if (isCompleted) {
                                    dotClass += " bg-blue-500 text-white";
                                } else {
                                    dotClass += " bg-slate-100 text-slate-400";
                                }

                                return (
                                    <div key={day} className="flex flex-col items-center">
                                        <div className={dotClass}>
                                            {isCompleted ? <CheckCircle className="w-5 h-5" /> : day}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Message */}
                        <p className="text-slate-600 leading-relaxed text-lg max-w-xl mx-auto mb-2">
                            {t.bonus.dayCompleted.replace('{day}', String(streakDay))}
                        </p>
                        {isWeekComplete ? (
                            <p className="text-blue-500 font-medium">
                                {t.bonus.weekComplete}
                            </p>
                        ) : (
                            <p className="text-slate-500">
                                {t.bonus.comeBackTomorrow.replace('{day}', nextStreak || '1')}
                            </p>
                        )}
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-slate-900 text-white">
                    <div className="max-w-7xl mx-auto px-4 pt-8 pb-8">
                        <div className="pt-4 border-t border-slate-800">
                            <p className="text-slate-400 text-sm font-light text-center">
                                © 2025 GetNearMe. {t.footer.rights}
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        );
    }

    if (status === 'error') {
        let errorTitle = t.bonus.error.defaultTitle;
        let errorMessage = t.bonus.error.defaultMessage;
        let Icon = AlertCircle;

        switch (error) {
            case 'already_claimed':
                errorTitle = t.bonus.error.alreadyClaimedTitle;
                errorMessage = t.bonus.error.alreadyClaimedMessage;
                Icon = Clock;
                break;
            case 'expired':
                errorTitle = t.bonus.error.expiredTitle;
                errorMessage = t.bonus.error.expiredMessage;
                Icon = Clock;
                break;
            case 'invalid_token':
                errorTitle = t.bonus.error.invalidTokenTitle;
                errorMessage = t.bonus.error.invalidTokenMessage;
                Icon = Ban;
                break;
            case 'missing_token':
                errorTitle = t.bonus.error.missingTokenTitle;
                errorMessage = t.bonus.error.missingTokenMessage;
                Icon = AlertCircle;
                break;
            case 'server_error':
                errorTitle = t.bonus.error.serverErrorTitle;
                errorMessage = t.bonus.error.serverErrorMessage;
                Icon = XCircle;
                break;
            default:
                if (message) errorMessage = message;
                break;
        }

        return (
            <div className="min-h-screen bg-white font-sans text-slate-900">
                <Navbar locale={locale} />

                <main className="min-h-screen flex items-center justify-center px-4">
                    <div className="max-w-2xl mx-auto text-center">
                        {/* Icon */}
                        <div className="mb-4 flex justify-center">
                            <Icon className="w-14 h-14 text-blue-500" />
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl text-slate-900 font-bold mb-2">
                            {errorTitle}
                        </h1>

                        {/* Description */}
                        <p className="text-slate-600 leading-relaxed text-lg max-w-xl mx-auto">
                            {errorMessage}
                        </p>
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-slate-900 text-white">
                    <div className="max-w-7xl mx-auto px-4 pt-8 pb-8">
                        <div className="pt-4 border-t border-slate-800">
                            <p className="text-slate-400 text-sm font-light text-center">
                                © 2025 GetNearMe. {t.footer.rights}
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        );
    }

    // Loading / Default state
    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            <Navbar locale={locale} />
            <main className="min-h-screen flex items-center justify-center px-4">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 bg-slate-200 rounded w-32 mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded w-48"></div>
                </div>
            </main>
        </div>
    );
}

export default function BonusResultPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center text-slate-400">
                Loading...
            </div>
        }>
            <BonusResultContent />
        </Suspense>
    );
}


