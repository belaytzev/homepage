// @vitest-environment jsdom

import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "test-utils/render-with-providers";
import { expectBlockValue } from "test-utils/widget-assertions";

const { useWidgetAPI } = vi.hoisted(() => ({ useWidgetAPI: vi.fn() }));
vi.mock("utils/proxy/use-widget-api", () => ({ default: useWidgetAPI }));

import Component from "./component";

function mockEndpoints(overrides = {}) {
  const defaults = {
    stats: { data: undefined, error: undefined },
    "stats/bandwidth": { data: undefined, error: undefined },
    nodes: { data: undefined, error: undefined },
  };
  const merged = { ...defaults, ...overrides };
  useWidgetAPI.mockImplementation((_widget, endpoint) => merged[endpoint] ?? { data: undefined, error: undefined });
}

describe("widgets/remnawave/component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders placeholders while loading", () => {
    mockEndpoints();

    const service = { widget: { type: "remnawave" } };
    const { container } = renderWithProviders(<Component service={service} />, { settings: { hideErrors: false } });

    expect(container.querySelectorAll(".service-block")).toHaveLength(4);
    expect(screen.getByText("remnawave.usersOnline")).toBeInTheDocument();
    expect(screen.getByText("remnawave.nodesOnline")).toBeInTheDocument();
    expect(screen.getByText("remnawave.bandwidthToday")).toBeInTheDocument();
    expect(screen.getByText("remnawave.bandwidthSevenDays")).toBeInTheDocument();
  });

  it("renders error state", () => {
    mockEndpoints({ stats: { data: undefined, error: { message: "boom" } } });

    const service = { widget: { type: "remnawave" } };
    renderWithProviders(<Component service={service} />, { settings: { hideErrors: false } });

    expect(screen.getByText(/widget\.api_error\s+widget\.information/)).toBeInTheDocument();
    expect(screen.getByText(/boom/)).toBeInTheDocument();
  });

  it("renders error when only bandwidth endpoint fails", () => {
    mockEndpoints({
      stats: { data: { response: {} }, error: undefined },
      nodes: { data: { response: [] }, error: undefined },
      "stats/bandwidth": { data: undefined, error: { message: "bandwidth failed" } },
    });

    const service = { widget: { type: "remnawave" } };
    renderWithProviders(<Component service={service} />, { settings: { hideErrors: false } });

    expect(screen.getByText(/widget\.api_error\s+widget\.information/)).toBeInTheDocument();
    expect(screen.getByText(/bandwidth failed/)).toBeInTheDocument();
  });

  it("renders placeholders when stats loads but bandwidth is still loading", () => {
    mockEndpoints({
      stats: { data: { response: {} }, error: undefined },
      nodes: { data: { response: [] }, error: undefined },
    });

    const service = { widget: { type: "remnawave" } };
    const { container } = renderWithProviders(<Component service={service} />, { settings: { hideErrors: false } });

    expect(container.querySelectorAll(".service-block")).toHaveLength(4);
    expect(screen.getByText("remnawave.usersOnline")).toBeInTheDocument();
  });

  it("falls back to zero when response fields are missing", () => {
    mockEndpoints({
      stats: { data: { response: {} }, error: undefined },
      "stats/bandwidth": { data: { response: {} }, error: undefined },
      nodes: { data: { response: {} }, error: undefined },
    });

    const { container } = renderWithProviders(<Component service={{ widget: { type: "remnawave" } }} />, {
      settings: { hideErrors: false },
    });

    expectBlockValue(container, "remnawave.usersOnline", 0);
    expectBlockValue(container, "remnawave.nodesOnline", 0);
    expectBlockValue(container, "remnawave.bandwidthToday", "0 B");
    expectBlockValue(container, "remnawave.bandwidthSevenDays", "0 B");
  });

  it("renders stats, connected nodes count, and bandwidth data", () => {
    mockEndpoints({
      stats: {
        data: {
          response: {
            onlineStats: { onlineNow: 42 },
          },
        },
        error: undefined,
      },
      "stats/bandwidth": {
        data: {
          response: {
            bandwidthLastTwoDays: { current: "2.53 GiB" },
            bandwidthLastSevenDays: { current: "16.61 GiB" },
          },
        },
        error: undefined,
      },
      nodes: {
        data: {
          response: [
            { name: "node-alpha", isConnected: true, isDisabled: false },
            { name: "node-beta", isConnected: true, isDisabled: false },
            { name: "node-gamma", isConnected: true, isDisabled: false },
            { name: "node-delta", isConnected: false, isDisabled: true },
          ],
        },
        error: undefined,
      },
    });

    const { container } = renderWithProviders(<Component service={{ widget: { type: "remnawave" } }} />, {
      settings: { hideErrors: false },
    });

    expectBlockValue(container, "remnawave.usersOnline", 42);
    expectBlockValue(container, "remnawave.nodesOnline", 3);
    expectBlockValue(container, "remnawave.bandwidthToday", "2.53 GiB");
    expectBlockValue(container, "remnawave.bandwidthSevenDays", "16.61 GiB");
  });
});
