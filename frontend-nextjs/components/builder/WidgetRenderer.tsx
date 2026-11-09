"use client";

import React, { useEffect, useState } from "react";
import {
  App as AntdApp,
  Button,
  Card,
  Input,
  Select,
  Space,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  CustomerServiceOutlined,
  GiftOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { BuilderDevice, BuilderWidget, getResponsiveProps } from "./model";
import { getBuilderObjectStyle, getBuilderTypographyStyle } from "./styles";

const { Text } = Typography;

interface WidgetRendererProps {
  widget: BuilderWidget;
  device: BuilderDevice;
  onSelect: () => void;
  previewMode?: boolean;
}

export function WidgetRenderer({
  widget,
  device,
  onSelect,
  previewMode = false,
}: WidgetRendererProps) {
  const { message } = AntdApp.useApp();
  const [now, setNow] = useState(() => Date.now());
  const [previewEventDate] = useState(
    () => new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
  );
  const [guestName, setGuestName] = useState("");
  const [attendance, setAttendance] = useState<string>();
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const props = getResponsiveProps(widget, device);
  const eventDate = String(
    props.eventDate || (previewMode ? previewEventDate : "")
  );
  const eventTime = new Date(eventDate).getTime();
  const secondsRemaining =
    widget.widgetType === "countdown" &&
    eventDate &&
    Number.isFinite(eventTime)
      ? Math.max(0, Math.floor((eventTime - now) / 1000))
      : null;

  useEffect(() => {
    if (
      widget.widgetType !== "countdown" ||
      !eventDate ||
      !Number.isFinite(eventTime)
    ) {
      return;
    }
    const timerId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, [eventDate, eventTime, widget.widgetType]);

  let icon: React.ReactNode;
  let description: string;
  switch (widget.widgetType) {
    case "countdown":
      icon = <CalendarOutlined />;
      description = previewMode
        ? "Countdown preview · dummy event data"
        : "Event date can be configured in properties.";
      break;
    case "rsvp":
      icon = <UserAddOutlined />;
      description = previewMode
        ? "Demo form · submissions remain local"
        : "Guest confirmation form widget.";
      break;
    case "music":
      icon = <CustomerServiceOutlined />;
      description = previewMode
        ? "Preview only · no audio configured"
        : "Audio player widget.";
      break;
    case "digital_gift":
      icon = <GiftOutlined />;
      description = previewMode
        ? "Sample gift details · no payment is processed"
        : "Digital gift information widget.";
      break;
  }

  return (
    <Card
      size="small"
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      className="h-full w-full cursor-pointer"
      style={{
        ...getBuilderObjectStyle(props),
        boxSizing: "border-box",
      }}
    >
      <Space align="start">
        <span className="pt-1 text-[#9A5A00]">{icon}</span>
        <div className="min-w-0">
          <Text
            strong
            className="block"
            style={getBuilderTypographyStyle(props)}
          >
            {String(props.title || widget.name)}
          </Text>
          <Text type="secondary" className="text-xs">
            {description}
          </Text>
          {widget.widgetType === "countdown" && (
            <div className="mt-2 text-xs tabular-nums">
              {secondsRemaining === null ? (
                <Text type="secondary">Set a valid event date in properties.</Text>
              ) : (
                `${Math.floor(secondsRemaining / 86400)}d ${Math.floor(
                  (secondsRemaining % 86400) / 3600
                )}h ${Math.floor((secondsRemaining % 3600) / 60)}m ${
                  secondsRemaining % 60
                }s`
              )}
            </div>
          )}
          {widget.widgetType === "rsvp" && (
            <div className="mt-2 space-y-2" onClick={(event) => event.stopPropagation()}>
              {rsvpSubmitted ? (
                <Text type="success">RSVP saved locally for this preview.</Text>
              ) : (
                <>
                  <Input
                    size="small"
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    placeholder="Your name"
                  />
                  <Select
                    size="small"
                    className="w-full"
                    value={attendance}
                    onChange={setAttendance}
                    placeholder={
                      <span style={{ color: "#9A5A00" }}>Belum menjawab</span>
                    }
                    options={[
                      {
                        value: "yes",
                        label: (
                          <span className="rounded bg-[#E7F4EA] px-2 py-0.5 text-[#173B2B]">
                            Hadir
                          </span>
                        ),
                      },
                      {
                        value: "no",
                        label: (
                          <span className="rounded bg-[#FCE9E6] px-2 py-0.5 text-[#7A2925]">
                            Tidak hadir
                          </span>
                        ),
                      },
                    ]}
                  />
                  <Button
                    size="small"
                    onClick={() => {
                      if (!guestName.trim() || !attendance) {
                        message.warning("Enter a name and choose an attendance option.");
                        return;
                      }
                      setRsvpSubmitted(true);
                    }}
                  >
                    {String(props.buttonLabel || "Kirim RSVP")}
                  </Button>
                </>
              )}
            </div>
          )}
          {widget.widgetType === "digital_gift" &&
            (props.accountNumber || previewMode) && (
              <div
                className="mt-2 flex items-center gap-2 text-xs"
                onClick={(event) => event.stopPropagation()}
              >
                <span>
                  {String(props.bankName || (previewMode ? "Bank InviteU" : ""))} ·{" "}
                  {String(props.accountNumber || (previewMode ? "1234567890" : ""))}
                </span>
                <Button
                  size="small"
                  onClick={async () => {
                    if (previewMode) {
                      message.success("Sample account number copied in preview.");
                      return;
                    }
                    try {
                      await navigator.clipboard.writeText(
                        String(
                          props.accountNumber ||
                            (previewMode ? "1234567890" : "")
                        )
                      );
                      message.success("Account number copied.");
                    } catch (error) {
                      message.error(
                        error instanceof Error
                          ? `Could not copy account number: ${error.message}`
                          : "Could not copy account number."
                      );
                    }
                  }}
                >
                  Copy
                </Button>
              </div>
            )}
          {widget.widgetType === "music" &&
            (props.audioUrl ? (
              <audio
                className="mt-2 w-full"
                controls
                src={String(props.audioUrl)}
                onClick={(event) => event.stopPropagation()}
              />
            ) : previewMode ? (
              <div
                className="mt-2 flex items-center gap-2"
                onClick={(event) => event.stopPropagation()}
              >
                <Button
                  size="small"
                  icon={
                    musicPlaying ? <PauseOutlined /> : <PlayCircleOutlined />
                  }
                  onClick={() => setMusicPlaying((playing) => !playing)}
                >
                  {musicPlaying ? "Pause demo" : "Play demo"}
                </Button>
                <Text type="secondary" className="text-[11px]">
                  Simulated · no audio playback
                </Text>
              </div>
            ) : null)}
        </div>
      </Space>
    </Card>
  );
}
