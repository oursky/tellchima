GIT_SHORT_SHA ?= $(shell git rev-parse --short=8 HEAD)

IMAGE_PLATFORM ?= amd64
IMAGE_REGISTRY ?= gcr.io/oursky-kube
IMAGE_TAG ?= $(IMAGE_REGISTRY)/tellchima:$(GIT_SHORT_SHA)
K8S_NAMESPACE ?= tellchima2

.PHONY: setup-local
setup-local:
	asdf plugin add nodejs || true
	asdf plugin add pnpm || true
	asdf install
	pnpm install

	cp -r .env.example .env

.PHONY: dev
dev:
	make generate
	make migrate
	pnpm start:dev

.PHONY: ngrok
ngrok:
	ngrok http 3000

.PHONY: dep
dep:
	pnpm install

.PHONY: generate
generate:
	pnpm generate

.PHONY: migrate
migrate:
	pnpm migrate

.PHONY: create-migration
create-migration:
	pnpm create-migration -- -n $(NAME)

.PHONY: cli-publish-and-discard
cli-publish-and-discard:
	pnpm cli:publish-and-discard

.PHONY: docker-image
docker-image:
	docker build \
		--file ./Dockerfile \
		--platform $(IMAGE_PLATFORM) \
		--tag $(IMAGE_TAG) \
		.

.PHONY: push-docker-image
push-docker-image:
	docker push $(IMAGE_TAG)

.PHONY: deploy
deploy:
	helm upgrade \
		--install \
		--namespace $(K8S_NAMESPACE) \
		--set-string appVersion="$(GIT_SHORT_SHA)" \
		--values ./helm/values.yaml \
		--values ./helm/encrypted.yaml \
		--timeout 10m \
		--wait \
		tellchima ./helm
