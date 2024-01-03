FRONTEND_DIR := frontend
BACKEND_DIR := backend

FRONTEND_NODE_MODULES := $(wildcard $(FRONTEND_DIR)/node_modules)

BACKEND_NODE_MODULES := $(wildcard $(BACKEND_DIR)/node_modules)

BACKEND_NODE_DOWNLOAD_FILES := $(wildcard $(BACKEND_DIR)/download/*.*)

BACKEND_NODE_SRT_FILES := $(wildcard $(BACKEND_DIR)/subtitles/srt/*.*)

BACKEND_NODE_VTT_FILES := $(wildcard $(BACKEND_DIR)/subtitles/vtt/*.*)

all:	start

start:	check_node_modules
		docker-compose up --build

stop:	docker-compose down

clean:
	docker-compose down --rmi all
	rm -rf $(FRONTEND_NODE_MODULES)
	rm -rf $(BACKEND_NODE_MODULES)
	rm -rf $(BACKEND_NODE_DOWNLOAD_FILES)
	rm -rf $(BACKEND_NODE_SRT_FILES)
	rm -rf $(BACKEND_NODE_VTT_FILES)
	@if [ -n "$(wildcard $(BACKEND_DIR)/imagesSaved/*)" ]; then \
		echo "Removing files in $(BACKEND_DIR)/imagesSaved/..."; \
		find $(BACKEND_DIR)/imagesSaved -type f ! -name 'baseAvatar.png' -delete; \
	fi

fclean:	clean
	docker system prune --all --force --volumes
	docker volume prune --all --force

re: fclean all

check_node_modules:
	@if [ ! -d "$(FRONTEND_NODE_MODULES)" ]; then \
		echo "Installing dependencies in $(FRONTEND_DIR)..."; \
		(cd $(FRONTEND_DIR) && npm i); \
	fi

	@if [ ! -d "$(BACKEND_NODE_MODULES)" ]; then \
		echo "Installing dependencies in $(BACKEND_DIR)..."; \
		(cd $(BACKEND_DIR) && npm i); \
	fi

.PHONY: start update stop clean fclean re