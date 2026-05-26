'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type FeedbackType = 'idle' | 'saved' | 'confirmed';

const RESET_MS = 1000;

export function useButtonFeedback(resetMs = RESET_MS) {
    const [feedback, setFeedback] = useState<FeedbackType>('idle');
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const reset = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setFeedback('idle');
    }, []);

    const showSaved = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setFeedback('saved');
        timerRef.current = setTimeout(() => setFeedback('idle'), resetMs);
    }, [resetMs]);

    const showConfirmed = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setFeedback('confirmed');
        timerRef.current = setTimeout(() => setFeedback('idle'), resetMs);
    }, [resetMs]);

    return {
        feedback,
        showSaved,
        showConfirmed,
        reset,
        isIdle: feedback === 'idle',
        isSaved: feedback === 'saved',
        isConfirmed: feedback === 'confirmed',
    };
}

/** Per-row / per-id feedback for table action buttons */
export function useActionFeedbackMap(resetMs = RESET_MS) {
    const [map, setMap] = useState<Record<string | number, FeedbackType>>({});
    const timersRef = useRef<Record<string | number, ReturnType<typeof setTimeout>>>({});

    useEffect(() => {
        return () => {
            Object.values(timersRef.current).forEach(clearTimeout);
        };
    }, []);

    const trigger = useCallback(
        (id: string | number, type: 'saved' | 'confirmed') => {
            if (timersRef.current[id]) clearTimeout(timersRef.current[id]);
            setMap((prev) => ({ ...prev, [id]: type }));
            timersRef.current[id] = setTimeout(() => {
                setMap((prev) => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
                delete timersRef.current[id];
            }, resetMs);
        },
        [resetMs]
    );

    const getFeedback = useCallback(
        (id: string | number): FeedbackType => map[id] ?? 'idle',
        [map]
    );

    return {
        getFeedback,
        triggerSaved: (id: string | number) => trigger(id, 'saved'),
        triggerConfirmed: (id: string | number) => trigger(id, 'confirmed'),
    };
}
