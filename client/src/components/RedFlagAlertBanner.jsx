import React from 'react';
import { AlertTriangle, Flame, ShieldAlert, PhoneCall, Activity } from 'lucide-react';

export default function RedFlagAlertBanner({ triggers = [], customMessage = null }) {
  if (!triggers || triggers.length === 0) return null;

  return (
    <div 
      role="alert" 
      aria-live="assertive"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-650 to-red-700 bg-red-600 text-white p-5 shadow-2xl border-2 border-red-400 animate-pulse-fast mb-6"
    >
      {/* Background glow effect */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
          <ShieldAlert className="w-8 h-8 text-white animate-bounce" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-white text-red-700 uppercase tracking-wider">
              CRITICAL EMERGENCY — ESI LEVEL 1
            </span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
          </div>

          <h3 className="mt-1 text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Deterministic Circuit-Breaker Triggered: Alerting ER Resuscitation Desk
          </h3>

          <p className="mt-1 text-sm text-red-100 font-medium">
            {customMessage || "Acute life-threatening indicators were detected in real-time. Standard triage queues bypassed. Medical response team notified."}
          </p>

          {/* Trigger Badges */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-200">
              Matched Red Flags:
            </span>
            {triggers.map((trigger, idx) => (
              <span 
                key={idx}
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-white/25 border border-white/40 text-white shadow-sm"
              >
                <Flame className="w-3.5 h-3.5 mr-1 text-yellow-300" />
                {trigger}
              </span>
            ))}
          </div>

          {/* Urgent instruction */}
          <div className="mt-3.5 pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-3 text-xs text-red-100">
            <div className="flex items-center gap-1.5 font-semibold">
              <Activity className="w-4 h-4 text-white" />
              <span>DO NOT LEAVE THIS STATION. Sit down immediately.</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
              <PhoneCall className="w-3.5 h-3.5 text-yellow-300" />
              <span>Attending Staff Code Blue / Rapid Response Paged</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
