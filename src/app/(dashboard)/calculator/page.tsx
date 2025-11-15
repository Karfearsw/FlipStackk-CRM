"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calculator, TrendingUp, DollarSign, Home } from "lucide-react";

export default function CalculatorPage() {
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [repairCosts, setRepairCosts] = useState<number>(0);
  const [arvValue, setArvValue] = useState<number>(0);

  const totalInvestment = purchasePrice + repairCosts;
  const profit = arvValue - totalInvestment;
  const roi = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0;
  const seventyPercentRule = arvValue * 0.7 - repairCosts;

  return (
    <div className="page-container">
      <div className="content-container space-y-6">
        <div className="flex items-center gap-2">
          <Calculator className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Deal Calculator</h1>
            <p className="text-muted-foreground">
              Analyze flip and rental deals
            </p>
          </div>
        </div>

        <Tabs defaultValue="flip" className="space-y-4">
          <TabsList>
            <TabsTrigger value="flip">
              <Home className="h-4 w-4 mr-2" />
              Flip Analysis
            </TabsTrigger>
            <TabsTrigger value="rental">
              <DollarSign className="h-4 w-4 mr-2" />
              Rental Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flip" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Inputs */}
              <Card>
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchase">Purchase Price</Label>
                    <Input
                      id="purchase"
                      type="number"
                      value={purchasePrice || ""}
                      onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repairs">Repair Costs</Label>
                    <Input
                      id="repairs"
                      type="number"
                      value={repairCosts || ""}
                      onChange={(e) => setRepairCosts(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arv">After Repair Value (ARV)</Label>
                    <Input
                      id="arv"
                      type="number"
                      value={arvValue || ""}
                      onChange={(e) => setArvValue(Number(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Investment</p>
                      <p className="text-2xl font-bold">${totalInvestment.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Potential Profit</p>
                      <p className={`text-2xl font-bold ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${profit.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ROI</p>
                      <p className="text-2xl font-bold">{roi.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">70% Rule Max</p>
                      <p className="text-2xl font-bold">${seventyPercentRule.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Deal Quality</h4>
                    <p className="text-sm text-muted-foreground">
                      {purchasePrice <= seventyPercentRule ? (
                        <span className="text-green-600 font-medium">✓ Meets 70% Rule - Good Deal!</span>
                      ) : (
                        <span className="text-orange-600 font-medium">⚠ Above 70% Rule - Review carefully</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {roi > 20 ? (
                        <span className="text-green-600 font-medium">✓ Strong ROI - Excellent!</span>
                      ) : roi > 10 ? (
                        <span className="text-blue-600 font-medium">○ Moderate ROI - Consider</span>
                      ) : (
                        <span className="text-red-600 font-medium">✗ Low ROI - Pass</span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rental" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rental Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Rental analysis calculator coming soon. Use the Flip Analysis tab for now.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
