import React from 'react';

/**
 * MemeCard 骨架屏组件
 * 在数据加载时显示，提供即时的视觉反馈
 */
const MemeCardSkeleton: React.FC = () => {
  return (
    <div className="relative bg-slate-900 overflow-hidden border-2 border-slate-800 h-full flex flex-col animate-pulse">
      {/* RPG Card Header Skeleton */}
      <div className="bg-slate-950 p-2 flex justify-between items-center border-b-2 border-slate-800 shrink-0">
        <div className="flex gap-2 items-center">
          <div className="w-2 h-2 bg-slate-700 rounded-none"></div>
          <div className="h-3 w-20 bg-slate-800 rounded"></div>
        </div>
        <div className="w-2 h-2 rounded-full bg-slate-700"></div>
      </div>

      {/* Image Container Skeleton */}
      <div className="relative w-full h-64 bg-slate-800 overflow-hidden border-b-2 border-slate-800 shrink-0">
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/50 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
        {/* Placeholder icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 text-slate-700 opacity-50">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </div>
      </div>

      {/* Content Body Skeleton */}
      <div className="p-5 relative flex flex-col flex-1">
        {/* Title skeleton */}
        <div className="mb-3">
          <div className="h-5 bg-slate-800 rounded w-3/4"></div>
        </div>

        {/* Description skeleton */}
        <div className="bg-slate-950 border border-slate-800 p-3 mb-4 h-24 shrink-0">
          <div className="space-y-2">
            <div className="h-3 bg-slate-800 rounded w-full"></div>
            <div className="h-3 bg-slate-800 rounded w-5/6"></div>
            <div className="h-3 bg-slate-800 rounded w-4/6"></div>
          </div>
        </div>
        
        {/* Tags skeleton */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="h-6 w-16 bg-slate-800 rounded"></div>
          <div className="h-6 w-12 bg-slate-800 rounded"></div>
          <div className="h-6 w-20 bg-slate-800 rounded"></div>
        </div>
        
        {/* Footer skeleton */}
        <div className="mt-auto pt-4 border-t-2 border-slate-800 flex justify-between items-center">
          <div className="h-4 w-20 bg-slate-800 rounded"></div>
          <div className="h-4 w-24 bg-slate-800 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default MemeCardSkeleton;
