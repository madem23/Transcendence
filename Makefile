DOCKER_COMPOSE_FILE := srcs/docker-compose.yml

all:	run

run:
	docker-compose -f $(DOCKER_COMPOSE_FILE) up

install-packages: update-upgrade
	sudo chmod +x install.sh
	sudo ./install.sh

build:	delete-package
	docker-compose -f $(DOCKER_COMPOSE_FILE) up --build

delete-package:
	sudo rm -rf srcs/nextjs/node_modules srcs/nestjs/dist srcs/nextjs/.next srcs/nextjs/node_modules

stop:
	docker-compose -f $(DOCKER_COMPOSE_FILE) stop

down:	
	docker-compose -f $(DOCKER_COMPOSE_FILE) down

clean:	stop
	docker-compose -f $(DOCKER_COMPOSE_FILE) down --volumes --remove-orphans
	docker system prune -a --force 

fclean:	clean delete-package
	docker volume prune --force
	docker network prune --force
	docker system prune --all --force --volumes

re:	fclean all


.PHONY:	all run build stop down clean fclean re delete-package