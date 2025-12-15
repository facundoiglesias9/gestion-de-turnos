"use client";

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.getRegistrations().then(function (registrations) {
                    for (let registration of registrations) {
                        registration.unregister();
                        console.log('SW Unregistered');
                    }
                });
            });
        }
    }, []);

    return null;
}
