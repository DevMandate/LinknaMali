import React, { useState } from "react";
import { faClipboard, faQuestionCircle, faBuilding, faDollarSign, faHome } from "@fortawesome/free-solid-svg-icons";

const LeadManagement = () => {
  const [leads, setLeads] = useState([
    "Lead 1",
    "Lead 2",
    "Lead 3",
    "Lead 4",
    "Lead 5",
  ]);

  const statistics = [
    { label: "Detail Views", value: 0, icon: faClipboard },
    { label: "Search Views", value: 0, icon: faQuestionCircle },
    { label: "Email Leads", value: 0, icon: faBuilding },
    { label: "Phone Leads", value: 0, icon: faDollarSign },
    { label: "Phone Clicks", value: 0, icon: faHome },
    { label: "Whatsapp Clicks", value: 0, icon: faClipboard },
    { label: "Recommended Leads", value: 0, icon: faQuestionCircle },
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-black">Lead Management</h1>

      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-black">Lead Search</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div className="flex flex-col">
            <select className="px-4 py-2 border rounded w-full mb-4">
              <option value="all">Mandate Type</option>
              <option value="type1">For Sale</option>
              <option value="type2">For Rent</option>
            </select>
          </div>

          <div className="flex flex-col">
            <select className="px-4 py-2 border rounded w-full mb-4">
              <option value="all">Category</option>
              <option value="category1">Houses</option>
              <option value="category2">Apartments</option>
              <option value="category3">Land</option>
              <option value="category4">Commercials</option>
            </select>
          </div>

          <div className="flex flex-col">
            <select className="px-4 py-2 border rounded w-full mb-4">
              <option value="all">Lead Type</option>
              <option value="type1">Phone Lead</option>
              <option value="type2">Email Lead</option>
              <option value="type3">Whatsapp Lead</option>
              <option value="type4">Recommended Lead</option>
            </select>
          </div>

          <div className="flex flex-col">
            <select className="px-4 py-2 border rounded w-full mb-4">
              <option value="all">Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="seen">Seen</option>
              <option value="lost">Lost</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex flex-col">
            <select className="px-4 py-2 border rounded w-full mb-4">
              <option value="all">Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex flex-col">
            <select className="px-4 py-2 border rounded w-full mb-4">
              <option value="last30days">Last 30 Days</option>
              <option value="last60days">Last 60 Days</option>
              <option value="last90days">Last 90 Days</option>
            </select>
          </div>

          <div className="flex flex-col">
            <input
              type="text"
              className="px-4 py-2 border rounded w-full mb-4"
              placeholder="Agent"
            />
          </div>

          <div className="flex flex-col">
            <input
              type="text"
              className="px-4 py-2 border rounded w-full mb-4"
              placeholder="ID"
            />
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4 text-black">Statistics</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {statistics.map((stat, index) => (
          <div
            key={index}
            className="bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 p-6 rounded-lg shadow-lg"
          >
            <div className="flex items-center justify-start mb-4">
              <div className="text-3xl text-white mr-4">
                <i className={`fa ${stat.icon}`} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">{stat.label}</h3>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
            <div className="w-full bg-white h-1 rounded-full opacity-30"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeadManagement;
