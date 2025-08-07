import { useEffect} from "react";

const AdobePDFViewer = ({ url, pdfSrc }) => {
    const initializeAdobeViewer = () => {
        if (!pdfSrc || !window.AdobeDC) return;
        const adobeDCView = new window.AdobeDC.View({
            clientId: "YOUR_CLIENT",
            divId: "adobe-dc-view",
        });

        adobeDCView.previewFile(
            {
                content: { location: { url: url } },
                metaData: { fileName: "Linknamali.pdf" },
            },
            {
                embedMode: "IN_LINE",
                showDownloadPDF: false,
                showPrintPDF: false,
            }
        );
    };
    const checkAdobeAvailability = () => {
        const interval = setInterval(() => {
            if (window.AdobeDC) {
                initializeAdobeViewer();
                clearInterval(interval);
            }
        }, 2000);
    };
    
    // Load Adobe Script on Mount
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://documentservices.adobe.com/view-sdk/viewer.js";
        script.onload = () => checkAdobeAvailability();
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Re-run Adobe Viewer when pdfSrc changes
    useEffect(() => {
        initializeAdobeViewer();
    }, [pdfSrc]);

    return <div id="adobe-dc-view" style={{ width: "100%" }}></div>;
};

export default AdobePDFViewer;
