import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, Check, AlertCircle, RefreshCw, Cpu, BrainCircuit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { formatCurrency, getCategoryColor } from '../utils/formatters';
import { api } from '../services/api';

export const ReceiptUpload = ({ addExpense }) => {
  const navigate = useNavigate();
  const toast = useToast();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Scanning state machine
  const [scanStatus, setScanStatus] = useState('idle'); // idle | uploading | scanning | completed
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedData, setParsedData] = useState(null);
  const [rawOcrText, setRawOcrText] = useState('');

  // Sample files that user can click to instantly parse (increases demo value!)
  const sampleReceipts = [
    { name: 'starbucks_latte.png', label: 'Starbucks Coffee Receipt' },
    { name: 'uber_invoice.png', label: 'Uber Ride Receipt' },
    { name: 'amazon_mouse.png', label: 'Amazon Shopping Receipt' }
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    
    setScanStatus('uploading');
    setUploadProgress(30);
    
    try {
      setUploadProgress(70);
      const data = await api.uploadReceipt(file);
      setUploadProgress(100);
      
      setScanStatus('completed');
      setParsedData({
        vendor: data.parsed_data.merchant,
        amount: data.parsed_data.amount,
        category: data.parsed_data.category,
        date: data.parsed_data.date,
        notes: data.parsed_data.description || "Uploaded receipt ledger entry",
        items: [
          { name: "Auto-Scanned Total", price: data.parsed_data.amount }
        ]
      });
      
      setRawOcrText(data.receipt.extracted_text);
      toast.success("AI scanned and ledgered receipt successfully!");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Scanning failed. Please try again.");
      resetScanner();
    }
  };

  const handleSampleClick = async (sample) => {
    // Generate a simulated file object based on name to test the live API fallback
    const mockBlob = new Blob(["Simulating file upload"], { type: "image/png" });
    const mockFile = new File([mockBlob], sample.name, { type: "image/png" });
    
    setSelectedFile({ name: sample.name, size: 245000 });
    
    // Set a matching mock image URL from Unsplash for visual stunningness
    let mockImg = "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=600";
    if (sample.name.includes("amazon")) {
      mockImg = "https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&q=80&w=600";
    } else if (sample.name.includes("uber")) {
      mockImg = "https://images.unsplash.com/photo-1527018601619-a508a2be00cd?auto=format&fit=crop&q=80&w=600";
    }
    
    setPreviewUrl(mockImg);
    await processFile(mockFile);
  };

  const confirmParsedExpense = () => {
    // The expense is ALREADY saved in the backend by our upload endpoint!
    // Simply toast and navigate back to the dashboard to refresh
    toast.success(`Expense from ${parsedData.vendor} has been ledgered!`);
    navigate('/dashboard');
  };

  const resetScanner = () => {
    setScanStatus('idle');
    setSelectedFile(null);
    setPreviewUrl(null);
    setParsedData(null);
    setRawOcrText('');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight my-0">
          AI Receipt Scanner
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Upload receipt image to automatically extract and ledger items using advanced OCR
        </p>
      </div>

      {scanStatus === 'idle' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Upload Dropzone */}
          <div className="lg:col-span-2">
            <Card
              className={`glass-card border-dashed border-2 h-[420px] flex flex-col items-center justify-center relative transition-all duration-300 ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/5 dark:bg-indigo-950/5 scale-[1.01]'
                  : 'border-slate-300 dark:border-slate-800 hover:border-indigo-500/50'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                multiple={false}
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                onChange={handleFileChange}
              />
              
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="p-4 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-full animate-bounce-slow">
                  <UploadCloud className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Drag and drop your receipt image here
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-medium">
                    Supports PNG, JPG, or PDF up to 10MB
                  </p>
                </div>
                
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">— OR —</span>
                
                <Button variant="primary" size="sm" className="relative z-20 pointer-events-none">
                  Select Local File
                </Button>
              </div>
            </Card>
          </div>

          {/* Quick Demo Preloads */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cpu className="w-4.5 h-4.5 text-indigo-500" />
                  <span>Try Demo Receipts</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Click a sample bill below to experience the real-time AI layout recognition and scan processing immediately!
                </p>
                <div className="space-y-2.5">
                  {sampleReceipts.map((sample) => (
                    <button
                      key={sample.name}
                      onClick={() => handleSampleClick(sample)}
                      className="w-full text-left p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/40 bg-white/20 dark:bg-slate-900/10 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-indigo-500 dark:hover:border-indigo-500 cursor-pointer active:scale-98 transition-all duration-200 flex items-center space-x-3 group"
                    >
                      <FileText className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{sample.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Progress & OCR Panel Display */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left panel: Scanning Image Preview */}
          <Card className="glass-card overflow-hidden flex flex-col justify-between">
            <CardHeader className="flex justify-between items-center py-3.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Receipt Media</span>
              {scanStatus === 'completed' && (
                <button
                  onClick={resetScanner}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Re-scan
                </button>
              )}
            </CardHeader>
            <CardContent className="p-0 flex-1 flex items-center justify-center bg-slate-950/40 relative min-h-[380px]">
              
              {/* Receipt Image */}
              <img
                src={previewUrl}
                alt="Receipt scan preview"
                className="max-h-[360px] object-contain rounded-lg opacity-85 select-none"
              />
              
              {/* Running Laser scanner animation */}
              {scanStatus === 'scanning' && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="animate-laser"></div>
                </div>
              )}

              {/* Uploading progress slider */}
              {scanStatus === 'uploading' && (
                <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between text-xs text-white font-bold">
                      <span>Uploading to Sandbox...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div className="h-2.5 bg-indigo-600 rounded-full transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Scanning visual state */}
              {scanStatus === 'scanning' && (
                <div className="absolute inset-x-0 bottom-6 flex justify-center">
                  <div className="bg-indigo-600/90 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg flex items-center space-x-2 animate-pulse border border-indigo-400/20">
                    <BrainCircuit className="w-4 h-4 animate-spin" />
                    <span>AI Layout Extraction in progress...</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right panel: Parsed structured results */}
          <div className="space-y-6">
            
            {scanStatus !== 'completed' ? (
              <Card className="glass-card h-full flex flex-col justify-center items-center p-8 text-center min-h-[380px] space-y-4">
                <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-400 animate-pulse">
                  <Cpu className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">
                    AI Structuring Awaiting Media
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mt-1">
                    Once the document upload finishes, our neural models will map individual line items here in real-time.
                  </p>
                </div>
              </Card>
            ) : (
              /* Scanning successfully completed! */
              <div className="space-y-6">
                {/* Structured Extraction Card */}
                <Card className="glass-card border-indigo-500/20 shadow-xl">
                  <CardHeader className="bg-indigo-600/5 py-3 border-b border-slate-200/40 dark:border-slate-800/30">
                    <CardTitle className="text-sm font-bold flex items-center space-x-2">
                      <BrainCircuit className="w-4 h-4 text-indigo-500" />
                      <span>Extracted Expense Fields</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 p-6">
                    <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Merchant</span>
                        <span className="text-slate-800 dark:text-slate-200 font-bold text-sm">{parsedData.vendor}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Category</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block mt-0.5 ${getCategoryColor(parsedData.category)}`}>
                          {parsedData.category}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Parsed Date</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">{parsedData.date}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Total Charge</span>
                        <span className="text-slate-900 dark:text-white font-extrabold text-base">{formatCurrency(parsedData.amount)}</span>
                      </div>
                    </div>

                    {/* Extracted Line Items list */}
                    <div className="border-t border-slate-200/40 dark:border-slate-800/20 pt-4 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Receipt Ledger Items</span>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-2">
                        {parsedData.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs py-1 hover:bg-slate-500/5 px-2 rounded-lg">
                            <span className="text-slate-600 dark:text-slate-300 font-semibold truncate max-w-xs">{item.name}</span>
                            <span className="text-slate-900 dark:text-white font-bold">{formatCurrency(item.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Save CTA */}
                    <div className="pt-2 flex items-center space-x-3">
                      <Button
                        onClick={resetScanner}
                        variant="outline"
                        className="flex-1 cursor-pointer font-semibold"
                      >
                        Reset / Cancel
                      </Button>
                      <Button
                        onClick={confirmParsedExpense}
                        variant="primary"
                        className="flex-1 cursor-pointer font-semibold"
                        icon={Check}
                      >
                        Ledger Expense
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Raw OCR logs */}
                <Card className="glass-card">
                  <CardHeader className="py-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Raw Extracted OCR Log</span>
                  </CardHeader>
                  <CardContent className="p-4 bg-slate-950/60 dark:bg-slate-950/80 rounded-xl">
                    <pre className="text-[9px] font-mono text-indigo-300/80 dark:text-indigo-400/85 leading-relaxed overflow-x-auto whitespace-pre">
                      {rawOcrText}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
