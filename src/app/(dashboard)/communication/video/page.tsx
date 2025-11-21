"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

export default function VideoPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [room, setRoom] = useState<string>("FlipStackk-Training-Room");
  const [api, setApi] = useState<any>(null);

  useEffect(() => {
    const scriptId = "jitsi-external-api";
    if (!document.getElementById(scriptId)) {
      const s = document.createElement("script");
      s.id = scriptId;
      s.src = "https://meet.jit.si/external_api.js";
      s.async = true;
      s.onload = () => init();
      document.body.appendChild(s);
    } else {
      init();
    }
    // cleanup
    return () => {
      api?.dispose?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function init(currentRoom = room) {
    if (!containerRef.current || !window.JitsiMeetExternalAPI) return;
    api?.dispose?.();
    const domain = "meet.jit.si";
    const options = {
      roomName: currentRoom,
      parentNode: containerRef.current,
      width: "100%",
      height: 700,
      configOverwrite: {
        prejoinPageEnabled: true,
      },
      interfaceConfigOverwrite: {
        TILE_VIEW_MAX_COLUMNS: 5,
      },
    };
    const instance = new window.JitsiMeetExternalAPI(domain, options);
    setApi(instance);
  }

  return (
    <div className="page-container">
      <div className="content-container space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Video Conferencing</h1>
            <p className="text-muted-foreground">Start or join training and collaboration calls</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Room Controls</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room name" />
            <Button onClick={() => init(room)}>Join Room</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div ref={containerRef} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}