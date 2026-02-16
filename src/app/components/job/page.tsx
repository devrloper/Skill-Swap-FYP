// import React from 'react';
// import { Search, MapPin, Briefcase, Clock, Bookmark, SlidersHorizontal } from 'lucide-react';

// const JobBoard = () => {
//   const jobs = [
//     { id: 1, company: 'Amazon', role: 'Senior UI/UX Designer', date: '20 May, 2023', pay: '$250/hr', loc: 'San Francisco, CA', color: 'bg-orange-100', tags: ['Part-time', 'Senior-level', 'Distant'] },
//     { id: 2, company: 'Google', role: 'Junior UI/UX Designer', date: '4 Feb, 2023', pay: '$150/hr', loc: 'California, CA', color: 'bg-emerald-100', tags: ['Full-time', 'Junior-level', 'Distant'] },
//     { id: 3, company: 'Dribbble', role: 'Senior Motion Designer', date: '29 Jun, 2023', pay: '$260/hr', loc: 'New York, NY', color: 'bg-purple-100', tags: ['Part-time', 'Senior-level', 'Full-day'] },
//     { id: 4, company: 'Twitter', role: 'UX Designer', date: '11 Apr, 2023', pay: '$120/hr', loc: 'California, CA', color: 'bg-blue-100', tags: ['Full-time', 'Middle-level', 'Distant'] },
//     { id: 5, company: 'Airbnb', role: 'Graphic Designer', date: '2 Apr, 2023', pay: '$300/hr', loc: 'New York, NY', color: 'bg-pink-100', tags: ['Part-time', 'Senior-level'] },
//     { id: 6, company: 'Apple', role: 'Graphic Designer', date: '18 Jan, 2023', pay: '$140/hr', loc: 'San Francisco, CA', color: 'bg-gray-100', tags: ['Part-time', 'Distant'] },
//   ];

//   return (
//     <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
//       <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
//         {/* SIDEBAR - Filters */}
//         <aside className="lg:col-span-3 space-y-8">
//           {/* Promo Card */}
//           <div className="bg-black text-white p-6 rounded-3xl relative overflow-hidden">
//             <h2 className="text-2xl font-bold mb-8 relative z-10">Get Your best profession with LuckyJob</h2>
//             <button className="bg-sky-400 text-black px-6 py-2 rounded-full font-semibold hover:bg-sky-300 transition-colors">
//               Learn more
//             </button>
//             <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10"></div>
//           </div>

//           {/* Filter Groups */}
//           <div className="space-y-6 hidden lg:block">
//             <div className="flex justify-between items-center">
//               <h3 className="font-bold text-lg">Filters</h3>
//               <SlidersHorizontal size={18} className="text-slate-400" />
//             </div>
            
//             <FilterGroup title="Working schedule" options={['Full-time', 'Part-time', 'Internship', 'Project work', 'Volunteering']} selected={['Full-time', 'Part-time', 'Project work']} />
//             <FilterGroup title="Employment type" options={['Full-day', 'Flexible schedule', 'Shift work', 'Distant work', 'Shift method']} selected={['Full-day', 'Flexible schedule', 'Distant work']} />
//           </div>
//         </aside>

//         {/* MAIN CONTENT - Job Grid */}
//         <main className="lg:col-span-9">
//           <header className="flex justify-between items-center mb-8">
//             <div className="flex items-center gap-4">
//               <h1 className="text-3xl font-bold tracking-tight">Recommended jobs</h1>
//               <span className="bg-white border px-3 py-1 rounded-full text-sm font-bold">386</span>
//             </div>
//             <div className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
//               Sort by: <span className="font-bold text-black">Last updated</span>
//               <SlidersHorizontal size={14} />
//             </div>
//           </header>

//           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
//             {jobs.map((job) => (
//               <JobCard key={job.id} {...job} />
//             ))}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };

// // --- Sub-components ---

// const FilterGroup = ({ title, options, selected }: { title: string, options: string[], selected: string[] }) => (
//   <div className="space-y-3">
//     <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{title}</h4>
//     {options.map(opt => (
//       <label key={opt} className="flex items-center gap-3 cursor-pointer group">
//         <input 
//           type="checkbox" 
//           checked={selected.includes(opt)} 
//           readOnly
//           className="w-5 h-5 rounded border-slate-300 text-black focus:ring-black" 
//         />
//         <span className="text-slate-600 group-hover:text-black transition-colors">{opt}</span>
//       </label>
//     ))}
//   </div>
// );

// const JobCard = ({ company, role, date, pay, loc, color, tags }: any) => (
//   <div className={`${color} p-6 rounded-[2.5rem] flex flex-col justify-between h-full hover:shadow-lg transition-shadow border border-black/5`}>
//     <div>
//       <div className="flex justify-between items-start mb-4">
//         <span className="bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full text-[12px] font-medium">{date}</span>
//         <button className="bg-white p-2 rounded-full shadow-sm hover:bg-slate-50">
//           <Bookmark size={16} />
//         </button>
//       </div>
      
//       <div className="mb-4">
//         <p className="text-sm font-medium opacity-70 mb-1">{company}</p>
//         <h3 className="text-xl font-bold leading-tight">{role}</h3>
//       </div>

//       <div className="flex flex-wrap gap-2 mb-8">
//         {tags.map((tag: string) => (
//           <span key={tag} className="border border-black/10 px-3 py-1 rounded-full text-[11px] font-medium">
//             {tag}
//           </span>
//         ))}
//       </div>
//     </div>

//     <div className="flex flex-col gap-4">
//       <div className="flex justify-between items-end">
//         <div>
//           <p className="text-lg font-black">{pay}</p>
//           <p className="text-xs opacity-60 font-medium">{loc}</p>
//         </div>
//         <button className="bg-black text-white px-6 py-2.5 rounded-2xl text-sm font-bold hover:bg-slate-800 transition-colors">
//           Details
//         </button>
//       </div>
//     </div>
//   </div>
// );

// export default JobBoard;