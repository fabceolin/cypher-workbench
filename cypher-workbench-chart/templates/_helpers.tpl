{{/*
Expand the name of the chart.
*/}}
{{- define "cypher-workbench.name" -}}
{{- default .Chart.Name .Values.nameOverride  < /dev/null |  trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "cypher-workbench.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "cypher-workbench.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "cypher-workbench.labels" -}}
helm.sh/chart: {{ include "cypher-workbench.chart" . }}
{{ include "cypher-workbench.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "cypher-workbench.selectorLabels" -}}
app.kubernetes.io/name: {{ include "cypher-workbench.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "cypher-workbench.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "cypher-workbench.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Neo4j fullname - Uses the dependency chart's naming structure
*/}}
{{- define "cypher-workbench.neo4j.fullname" -}}
{{- if .Values.neo4j._compatibility.fullname }}
{{- .Values.neo4j._compatibility.fullname | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-neo4j" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Neo4j HTTP service name - used to connect to Neo4j Browser
*/}}
{{- define "cypher-workbench.neo4j.httpServiceName" -}}
{{- printf "%s-neo4j" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Neo4j Bolt service name or URI - used for connecting to Neo4j via bolt
*/}}
{{- define "cypher-workbench.neo4j.boltURI" -}}
{{- if .Values.neo4j.enabled -}}
bolt://{{ printf "%s-neo4j" .Release.Name | trunc 63 | trimSuffix "-" }}:7687
{{- else -}}
{{- .Values.externalNeo4j.uri }}
{{- end -}}
{{- end }}

{{/*
Neo4j Bolt service name - used for connecting to Neo4j via bolt
*/}}
{{- define "cypher-workbench.neo4j.boltServiceName" -}}
{{- printf "%s-neo4j" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Neo4j HTTP port - used for Neo4j Browser
*/}}
{{- define "cypher-workbench.neo4j.httpPort" -}}
{{- .Values.neo4j._compatibility.service.httpPort | default 7474 }}
{{- end }}

{{/*
Neo4j Bolt port - used for database connections
*/}}
{{- define "cypher-workbench.neo4j.boltPort" -}}
{{- .Values.neo4j._compatibility.service.boltPort | default 7687 }}
{{- end }}

{{/*
Neo4j username
*/}}
{{- define "cypher-workbench.neo4j.username" -}}
{{- if .Values.neo4j.enabled -}}
{{- .Values.neo4j._compatibility.username | default "neo4j" }}
{{- else -}}
{{- .Values.externalNeo4j.username }}
{{- end -}}
{{- end }}

{{/*
Neo4j password
*/}}
{{- define "cypher-workbench.neo4j.password" -}}
{{- if .Values.neo4j.enabled -}}
{{- .Values.neo4j.neo4j.password | default .Values.neo4j._compatibility.password }}
{{- else -}}
{{- .Values.externalNeo4j.password }}
{{- end -}}
{{- end }}

{{/*
Neo4j database
*/}}
{{- define "cypher-workbench.neo4j.database" -}}
{{- if .Values.neo4j.enabled -}}
neo4j
{{- else -}}
{{- .Values.externalNeo4j.database }}
{{- end -}}
{{- end }}

{{/*
API fullname
*/}}
{{- define "cypher-workbench.api.fullname" -}}
{{- if .Values.api.nameOverride }}
{{- printf "%s-%s" (include "cypher-workbench.fullname" .) .Values.api.nameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-api" (include "cypher-workbench.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
API labels
*/}}
{{- define "cypher-workbench.api.labels" -}}
{{ include "cypher-workbench.labels" . }}
app.kubernetes.io/component: api
{{- end }}

{{/*
API selector labels
*/}}
{{- define "cypher-workbench.api.selectorLabels" -}}
{{ include "cypher-workbench.selectorLabels" . }}
app.kubernetes.io/component: api
{{- end }}

{{/*
UI fullname
*/}}
{{- define "cypher-workbench.ui.fullname" -}}
{{- if .Values.ui.nameOverride }}
{{- printf "%s-%s" (include "cypher-workbench.fullname" .) .Values.ui.nameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-ui" (include "cypher-workbench.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
UI labels
*/}}
{{- define "cypher-workbench.ui.labels" -}}
{{ include "cypher-workbench.labels" . }}
app.kubernetes.io/component: ui
{{- end }}

{{/*
UI selector labels
*/}}
{{- define "cypher-workbench.ui.selectorLabels" -}}
{{ include "cypher-workbench.selectorLabels" . }}
app.kubernetes.io/component: ui
{{- end }}
