<?php
  class UpgradeFunctionality extends Query{
    public function query($pdo, $args){
      $st = $pdo->prepare('
        select idUser as id, U.points as points, F.points as fpoints, (
          select count(*) from Functionality
          where idFunc = ?
        ) as funcs, (
          select count(*) from Upgrade
          where user = idUser and func = ?
        ) as ups
        from User U, Functionality F
        where token = ?
      ');
      $st->execute([$args->idFunc, $args->idFunc, $args->token]);
      $row = $st->fetch();

      if($row === false || $row['funcs'] !== 1 || $row['ups'] !== 0){
        $this->err('data');
        return;
      }

      if($row['points'] < $row['fpoints']){
        $this->err('notEnoughPoints');
        return;
      }

      $pdo->prepare('
        update User
        set points = ?
        where idUser = ?
      ')->execute([$row['points'] - $row['fpoints'], $row['id']]);

      $pdo->prepare('
        insert into Upgrade (
          user,
          func
        ) value (?, ?)
      ')->execute([$row['id'], $args->idFunc]);

      $this->succ();
    }
  }

  new UpgradeFunctionality();
?>