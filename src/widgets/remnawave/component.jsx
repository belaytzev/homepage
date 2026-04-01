import Block from "components/services/widget/block";
import Container from "components/services/widget/container";
import { useTranslation } from "next-i18next";

import useWidgetAPI from "utils/proxy/use-widget-api";

export default function Component({ service }) {
  const { t } = useTranslation();
  const { widget } = service;

  const { data: statsData, error: statsError } = useWidgetAPI(widget, "stats");
  const { data: bandwidthData, error: bandwidthError } = useWidgetAPI(widget, "stats/bandwidth");
  const { data: nodesData, error: nodesError } = useWidgetAPI(widget, "nodes");

  if (statsError || bandwidthError || nodesError) {
    return <Container service={service} error={statsError || bandwidthError || nodesError} />;
  }

  if (!statsData || !bandwidthData || !nodesData) {
    return (
      <Container service={service}>
        <Block label="remnawave.usersOnline" />
        <Block label="remnawave.nodesOnline" />
        <Block label="remnawave.bandwidthToday" />
        <Block label="remnawave.bandwidthSevenDays" />
      </Container>
    );
  }

  const onlineNow = statsData.response?.onlineStats?.onlineNow ?? 0;
  const nodes = Array.isArray(nodesData.response) ? nodesData.response : [];
  const nodesOnline = nodes.filter((node) => node.isConnected).length;
  const bandwidthToday = bandwidthData.response?.bandwidthLastTwoDays?.current ?? "0 B";
  const bandwidthSevenDays = bandwidthData.response?.bandwidthLastSevenDays?.current ?? "0 B";

  return (
    <Container service={service}>
      <Block label="remnawave.usersOnline" value={t("common.number", { value: onlineNow })} />
      <Block label="remnawave.nodesOnline" value={t("common.number", { value: nodesOnline })} />
      <Block label="remnawave.bandwidthToday" value={bandwidthToday} />
      <Block label="remnawave.bandwidthSevenDays" value={bandwidthSevenDays} />
    </Container>
  );
}
