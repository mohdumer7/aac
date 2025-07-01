import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ReportMasterComponent from "../ReportMasterComponent/ReportMasterComponent";


interface ReportComponentProps {
  config: any;
  loadingState: boolean;
  rowClassMap: any;
  summary: boolean;
  selectedRegion: any;
  setSelectedRegion: any;
  selectedArea: any;
  setSelectedArea: any;
}

const ReportComponent: React.FC<ReportComponentProps> = ({ config, loadingState, summary,selectedRegion,setSelectedRegion,selectedArea,setSelectedArea  }) => {
  const [activeTab, setActiveTab] = useState(config.tabs[0]?.title);

  return (
    <>
        <div className="w-full pt-2 ">
          <Tabs value={activeTab} onValueChange={(value)=>{setActiveTab(value); setSelectedRegion(''); setSelectedArea('')}} className="w-full px-4" >
            {/* Tab Navigation */}
            <TabsList className="flex gap-2 bg-slate-300 text-slate-800">
              {config.tabs.map((tab:any) => (
                <TabsTrigger key={tab.title} value={tab.title} width={"full"}  className="data-[state=active]:bg-red-700 data-[state=active]:text-white">
                  {tab.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab Content */}
            {config.tabs.map((tab:any) => (
              <TabsContent key={tab.title} value={tab.title} >
                <ReportMasterComponent config={tab} loadingState={loadingState} rowClassMap={undefined} summary = {summary} selectedRegion = {selectedRegion} setSelectedRegion = {setSelectedRegion} selectedArea = {selectedArea} setSelectedArea={setSelectedArea} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
    </>

  );
};

export default ReportComponent;
