<?php
  class ProcessNextCompetition extends Query{
    public function query($pdo, $args){
      $st = $pdo->prepare('
        select idComp from Competition
        where idComp = (
          select min(idComp)
          from Competition
        )
      ');
      $st->execute([]);
      $row = $st->fetch();
      $idComp = $row['idComp'];

      $data = [];

      $st = $pdo->prepare('
        select (
          select nick from User
          where idUser = user
        ) as nick, (
          select points from User
          where idUser = user
        ) as points, lang, script
        from Participating
        where comp = ?
      ');
      $st->execute([$idComp]);
      $data['users'] = $st->fetchAll();

      $st = $pdo->prepare('
        delete from Competition
        where idComp = ?
      ');
      $st->execute([$idComp]);

      $st = $pdo->prepare('
        delete from Participating
        where comp = ?
      ');
      $st->execute([$idComp]);

      $this->succ($data);
    }
  }

  new ProcessNextCompetition();
?>