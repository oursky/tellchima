.PHONY: setup-local
setup-local:
	asdf plugin add nodejs || true
	asdf plugin add pnpm || true
	asdf install
	pnpm install

	cp -r .env.example .env

.PHONY: start
start:
	pnpm start:dev

.PHONY: ngrok
ngrok:
	ngrok http 3000

.PHONY: deploy
deploy:
	fly deploy
