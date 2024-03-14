import { ViewColumn } from "vscode";
import type { WebviewPanelConfig } from "../../common/vscode/abstract-webview";
import { AbstractWebview } from "../../common/vscode/abstract-webview";
import { assertNever } from "../../common/helpers-pure";
import { telemetryListener } from "../../common/vscode/telemetry";
import type {
  FromModelAlertsMessage,
  ToModelAlertsMessage,
} from "../../common/interface-types";
import type { App } from "../../common/app";
import { redactableError } from "../../common/errors";
import { extLogger } from "../../common/logging/vscode";
import { showAndLogExceptionWithTelemetry } from "../../common/logging";
import type { ModelingEvents } from "../modeling-events";
import type { ModelingStore } from "../modeling-store";
import type { DatabaseItem } from "../../databases/local-databases";

export class ModelAlertsView extends AbstractWebview<
  ToModelAlertsMessage,
  FromModelAlertsMessage
> {
  public static readonly viewType = "codeQL.modelAlerts";

  public constructor(
    app: App,
    private readonly modelingEvents: ModelingEvents,
    private readonly modelingStore: ModelingStore,
    private readonly dbItem: DatabaseItem,
  ) {
    super(app);

    this.registerToModelingEvents();
  }

  public async showView() {
    const panel = await this.getPanel();
    panel.reveal(undefined, true);

    await this.waitForPanelLoaded();
  }

  protected async getPanelConfig(): Promise<WebviewPanelConfig> {
    return {
      viewId: ModelAlertsView.viewType,
      title: "Model Alerts",
      viewColumn: ViewColumn.Active,
      preserveFocus: true,
      view: "model-alerts",
    };
  }

  protected onPanelDispose(): void {
    this.modelingStore.updateIsModelAlertsViewOpen(this.dbItem, false);
  }

  protected async onMessage(msg: FromModelAlertsMessage): Promise<void> {
    switch (msg.t) {
      case "viewLoaded":
        this.onWebViewLoaded();
        break;
      case "telemetry":
        telemetryListener?.sendUIInteraction(msg.action);
        break;
      case "unhandledError":
        void showAndLogExceptionWithTelemetry(
          extLogger,
          telemetryListener,
          redactableError(
            msg.error,
          )`Unhandled error in model alerts view: ${msg.error.message}`,
        );
        break;
      default:
        assertNever(msg);
    }
  }

  public async focusView(): Promise<void> {
    this.panel?.reveal();
  }

  private registerToModelingEvents() {
    this.push(
      this.modelingEvents.onFocusModelAlertsView(async (event) => {
        if (event.dbUri === this.dbItem.databaseUri.toString()) {
          await this.focusView();
        }
      }),
    );

    this.push(
      this.modelingEvents.onDbClosed(async (event) => {
        if (event === this.dbItem.databaseUri.toString()) {
          this.dispose();
        }
      }),
    );
  }
}